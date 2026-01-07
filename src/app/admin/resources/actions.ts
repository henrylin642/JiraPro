'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getResources() {
    try {
        const resources = await prisma.user.findMany({
            include: {
                resourceProfile: true,
            },
            orderBy: {
                name: 'asc',
            }
        });

        // Serializing Decimal to number for client components
        return resources.map(user => ({
            ...user,
            resourceProfile: user.resourceProfile ? {
                ...user.resourceProfile,
                costRate: Number(user.resourceProfile.costRate),
                billableRate: Number(user.resourceProfile.billableRate),
                monthlySalary: Number(user.resourceProfile.monthlySalary || 0),
            } : null
        }));
    } catch (error) {
        console.error('Failed to fetch resources:', error);
        return [];
    }
}

export type UpdateResourceData = {
    name?: string;
    role?: string;
    title?: string;
    skills?: string;
    monthlySalary?: number;
    costRate?: number;
    billableRate?: number;
    capacityHours?: number;
};

export async function updateResource(userId: string, data: UpdateResourceData) {
    try {
        // Update User Name/Role if provided
        if (data.name || data.role) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    name: data.name,
                    role: data.role
                }
            });
        }

        // Check if profile exists
        const existingProfile = await prisma.resourceProfile.findUnique({
            where: { userId },
        });

        if (existingProfile) {
            await prisma.resourceProfile.update({
                where: { userId },
                data: {
                    title: data.title,
                    skills: data.skills,
                    monthlySalary: data.monthlySalary,
                    costRate: data.costRate,
                    billableRate: data.billableRate,
                    capacityHours: data.capacityHours,
                },
            });
        } else {
            await prisma.resourceProfile.create({
                data: {
                    userId,
                    title: data.title,
                    skills: data.skills,
                    monthlySalary: data.monthlySalary || 0,
                    costRate: data.costRate || 0,
                    billableRate: data.billableRate || 0,
                    capacityHours: data.capacityHours || 40,
                },
            });
        }

        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        console.error('Failed to update resource:', error);
        return { success: false, error: 'Failed to update resource' };
    }
}

export async function getAllocations(startDate: Date, endDate: Date) {
    try {

        const allocations = await prisma.allocation.findMany({
            where: {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
            include: {
                resource: {
                    include: {
                        user: true
                    }
                },
                project: true,
                opportunity: true,
            }
        });

        // Serialize Decimal fields
        return allocations.map(allocation => ({
            ...allocation,
            resource: allocation.resource ? {
                ...allocation.resource,
                costRate: Number(allocation.resource.costRate),
                billableRate: Number(allocation.resource.billableRate),
            } : null,
            opportunity: allocation.opportunity ? {
                ...allocation.opportunity,
                estimatedValue: Number(allocation.opportunity.estimatedValue),
            } : null,
            project: allocation.project ? {
                ...allocation.project,
                budget: Number(allocation.project.budget),
            } : null
        }));
    } catch (error) {
        console.error('Failed to fetch allocations:', error);
        return [];
    }
}

export type CreateResourceData = {
    name: string;
    email: string;
    role: string;
    title?: string;
    skills?: string;
    monthlySalary?: number;
    costRate?: number;
    billableRate?: number;
    capacityHours?: number;
};

export async function createResource(data: CreateResourceData) {
    try {
        // Create User
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role as any, // Cast to enum
            }
        });

        // Create Profile
        await prisma.resourceProfile.create({
            data: {
                userId: user.id,
                title: data.title,
                skills: data.skills,
                monthlySalary: data.monthlySalary || 0,
                costRate: data.costRate || 0,
                billableRate: data.billableRate || 0,
                capacityHours: data.capacityHours || 40,
            }
        });

        revalidatePath('/admin/resources');
        return { success: true, user };
    } catch (error) {
        console.error('Failed to create resource:', error);
        return { success: false, error: 'Failed to create resource' };
    }
}

export async function deleteResource(userId: string) {
    try {
        // 1. Check for Timesheets (Financial History)
        const timesheetCount = await prisma.timesheetEntry.count({
            where: { userId }
        });

        if (timesheetCount > 0) {
            return {
                success: false,
                error: `Cannot delete resource with ${timesheetCount} timesheet entries. Financial history must be preserved.`
            };
        }

        // 2. Clean up Resource Profile & Allocations
        const profile = await prisma.resourceProfile.findUnique({
            where: { userId }
        });

        if (profile) {
            // Delete allocations
            await prisma.allocation.deleteMany({
                where: { resourceId: profile.id }
            });
            // Delete profile
            await prisma.resourceProfile.delete({
                where: { userId }
            });
        }

        // 3. Unassign from Tasks
        await prisma.task.updateMany({
            where: { assigneeId: userId },
            data: { assigneeId: null }
        });

        // 4. Unassign from Projects (Manager)
        await prisma.project.updateMany({
            where: { managerId: userId },
            data: { managerId: null }
        });

        // 5. Delete User
        await prisma.user.delete({
            where: { id: userId }
        });

        revalidatePath('/admin/resources');
        return { success: true };
    } catch (error) {
        console.error("Error deleting resource:", error);
        return { success: false, error: "Failed to delete resource." };
    }
}
