'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function changePassword(currentPassword: string, newPassword: string) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify current password
        // Note: In a real app, use bcrypt.compare here. Currently using plain text as per existing pattern.
        if (user.password !== currentPassword) {
            return { success: false, error: 'Incorrect current password' };
        }

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: newPassword }
        });

        // Revalidate
        revalidatePath('/admin/settings');

        return { success: true };
    } catch (error) {
        console.error('Change password failed:', error);
        return { success: false, error: 'Failed to change password' };
    }
}

export async function backupSystem() {
    try {
        const users = await prisma.user.findMany();
        const accounts = await prisma.account.findMany();
        const products = await prisma.product.findMany();
        const resourceProfiles = await prisma.resourceProfile.findMany();
        const contacts = await prisma.contact.findMany();
        const interactions = await prisma.interaction.findMany();
        const features = await prisma.feature.findMany({ include: { opportunities: { select: { id: true } } } });
        const roadmapItems = await prisma.roadmapItem.findMany();
        const opportunities = await prisma.opportunity.findMany({ include: { features: { select: { id: true } } } });
        const projects = await prisma.project.findMany();
        const milestones = await prisma.milestone.findMany();
        const tasks = await prisma.task.findMany(); // ParentId handled by self-reference, logic needed on restore
        const allocations = await prisma.allocation.findMany();
        const ideas = await prisma.idea.findMany();
        const timesheetEntries = await prisma.timesheetEntry.findMany();
        const expenseCategories = await prisma.expenseCategory.findMany();

        const data = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            users,
            accounts,
            products,
            resourceProfiles,
            contacts,
            interactions,
            features,
            roadmapItems,
            opportunities,
            projects,
            milestones,
            tasks,
            allocations,
            ideas,
            timesheetEntries,
            expenseCategories
        };

        return { success: true, data: JSON.stringify(data, null, 2) };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error: 'Backup generation failed' };
    }
}

export async function restoreSystem(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validation - Basic check
        if (!data.version || !data.users) {
            return { success: false, error: 'Invalid backup file format' };
        }

        await prisma.$transaction(async (tx) => {
            // 1. DELETE ALL (Reverse Order)
            // Note: Use deleteMany({}) to clear tables. Order matters for FK constraints.
            await tx.expenseCategory.deleteMany();
            await tx.timesheetEntry.deleteMany();
            await tx.allocation.deleteMany();
            await tx.idea.deleteMany();
            // Feature <-> Opportunity is implicit. Breaking relations usually fine if both deleted?
            // Actually, implicit tables cascade delete.
            await tx.interaction.deleteMany();
            await tx.contact.deleteMany();
            // Task self-reference: Delete all usually works or might need recursive logic?
            // SQLite/Prisma typically handles 'deleteMany' without checking constraints row-by-row if no restrict.
            // But if restrict... Task->Project is ok. Task->Task?
            // To be safe, we can try deleting. If it fails on self-ref, we might need to nullify parents first.
            // Let's try direct delete.
            await tx.task.deleteMany();
            await tx.milestone.deleteMany();
            await tx.project.deleteMany();
            await tx.opportunity.deleteMany(); // Cascade breaks features link
            await tx.roadmapItem.deleteMany();
            await tx.feature.deleteMany();
            await tx.product.deleteMany();
            await tx.resourceProfile.deleteMany();
            await tx.account.deleteMany();
            await tx.user.deleteMany();

            // 2. RESTORE ALL (Forward Order)
            // Note: We ignore many-to-many link tables in createMany usually, dealing with them via connect?
            // Prisma createMany DOES NOT support nested relations (connect).
            // So we must iterate for tables with relations if we want to restore links.
            // Performance hit, but necessary for correct restoration of relations.

            // A. Users
            if (data.users?.length) await tx.user.createMany({ data: data.users });

            // B. Accounts
            if (data.accounts?.length) await tx.account.createMany({ data: data.accounts });

            // C. Products
            if (data.products?.length) await tx.product.createMany({ data: data.products });

            // D. ResourceProfiles
            if (data.resourceProfiles?.length) await tx.resourceProfile.createMany({ data: data.resourceProfiles });

            // E. Contacts
            if (data.contacts?.length) await tx.contact.createMany({ data: data.contacts });

            // F. Interactions
            if (data.interactions?.length) await tx.interaction.createMany({ data: data.interactions });

            // G. Features (Has relation to Opportunity, but we restore Opportunity later. Just create Feature first.)
            // We need to strip 'opportunities' from the data object if it exists from backup include.
            for (const f of data.features || []) {
                const { opportunities, ...rest } = f;
                await tx.feature.create({ data: rest });
            }

            // H. RoadmapItems
            if (data.roadmapItems?.length) await tx.roadmapItem.createMany({ data: data.roadmapItems });

            // I. Opportunities (Need to connect Features)
            // Data has 'features' array of IDs from backup?
            // Backup used: include: { features: { select: { id: true } } }
            // So structure is: { ..., features: [ { id: '...' }, { id: '...' } ] }
            for (const o of data.opportunities || []) {
                const { features, ...rest } = o;
                await tx.opportunity.create({
                    data: {
                        ...rest,
                        features: {
                            connect: features // This works perfectly matching the include structure
                        }
                    }
                });
            }

            // J. Projects
            if (data.projects?.length) await tx.project.createMany({ data: data.projects });

            // K. Milestones
            if (data.milestones?.length) await tx.milestone.createMany({ data: data.milestones });

            // L. Tasks (Complex: Self-relation)
            // Strategy: Create all tasks with parentId = null (or stripped), then update them.
            // Or simpler: Iterate and create. If parent exists, connect.
            // If parent is created LATER, this fails.
            // So: 1. Create all without parents. 2. Update all with parents.
            if (data.tasks?.length) {
                // Pass 1: Create w/o parent
                const tasksWithParents = [];
                for (const t of data.tasks) {
                    const { parentId, parent, subtasks, ...rest } = t; // Strip relations
                    if (parentId) tasksWithParents.push({ id: t.id, parentId });
                    await tx.task.create({ data: rest }); // 'rest' has no parentId
                }
                // Pass 2: Link parents
                for (const t of tasksWithParents) {
                    await tx.task.update({
                        where: { id: t.id },
                        data: { parentId: t.parentId }
                    });
                }
            }

            // M. Allocations
            if (data.allocations?.length) await tx.allocation.createMany({ data: data.allocations });

            // N. Ideas
            // Idea depends on Feature (optional). Feature exists.
            if (data.ideas?.length) await tx.idea.createMany({ data: data.ideas });

            // O. TimesheetEntries
            if (data.timesheetEntries?.length) await tx.timesheetEntry.createMany({ data: data.timesheetEntries });

            // P. Expense Categories
            if (data.expenseCategories?.length) await tx.expenseCategory.createMany({ data: data.expenseCategories });

        }, {
            maxWait: 10000,
            timeout: 20000
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Restore failed:', error);
        return { success: false, error: 'Restore failed: ' + (error as Error).message };
    }
}

export async function getExpenseCategories() {
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return categories;
    } catch (error) {
        console.error("Error fetching expense categories:", error);
        return [];
    }
}

export async function addExpenseCategory(name: string) {
    try {

        // Check for duplicates
        const existing = await prisma.expenseCategory.findUnique({
            where: { name }
        });

        if (existing) {
            return { success: false, error: "Category already exists" };
        }

        const category = await prisma.expenseCategory.create({
            data: { name }
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/project');
        return { success: true, category };
    } catch (error) {
        console.error("Error adding expense category:", error);
        return { success: false, error: "Failed to add category: " + (error as Error).message };
    }
}

export async function deleteExpenseCategory(id: string) {
    try {
        await prisma.expenseCategory.delete({
            where: { id }
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/project');
        return { success: true };
    } catch (error) {
        console.error("Error deleting expense category:", error);
        return { success: false, error: "Failed to delete category" };
    }
}
