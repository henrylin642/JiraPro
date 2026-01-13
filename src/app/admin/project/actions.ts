'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProjects() {
    try {
        const projects = await prisma.project.findMany({
            include: {
                account: {
                    select: { id: true, name: true }
                },
                manager: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                milestones: {
                    select: { id: true, amount: true }
                },
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        timesheets: {
                            select: {
                                hours: true,
                                costRate: true,
                                billableRate: true
                            }
                        }
                    }
                },
                expenses: {
                    select: { id: true, amount: true }
                },
                serviceArea: {
                    select: { id: true, name: true }
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Convert Decimals to numbers for serialization
        return projects.map(project => ({
            ...project,
            budget: Number(project.budget),
            milestones: project.milestones.map(m => ({
                ...m,
                amount: Number(m.amount)
            })),
            expenses: project.expenses.map(e => ({
                ...e,
                amount: Number(e.amount)
            })),
            tasks: project.tasks.map(t => ({
                ...t,
                timesheets: t.timesheets.map(ts => ({
                    ...ts,
                    hours: Number(ts.hours),
                    costRate: Number(ts.costRate),
                    billableRate: Number(ts.billableRate)
                }))
            }))
        }));
        return projects;
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}

export async function getProjectById(id: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                account: true,
                manager: true,
                milestones: {
                    orderBy: { dueDate: 'asc' }
                },
                allocations: {
                    include: {
                        resource: {
                            include: { user: true }
                        }
                    }
                },
                expenses: {
                    orderBy: { date: 'desc' }
                },
                // Include timesheets linked via Tasks to this project
                tasks: {
                    include: {
                        assignee: {
                            include: {
                                resourceProfile: true
                            }
                        },
                        timesheets: {
                            include: { user: true }
                        }
                    },
                    orderBy: { startDate: 'asc' }
                }
            },
        });
        return project;
    } catch (error) {
        console.error("Error fetching project:", error);
        return null;
    }
}

export async function getAllTasks() {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                assignee: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                project: {
                    select: { id: true, name: true }
                },
                opportunity: {
                    select: { id: true, title: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Simple serialization if needed, or return directly as Date objects are often handled by Next.js now, 
        // but to be safe and match patterns:
        return tasks.map(task => ({
            ...task,
            opportunityId: task.opportunityId,
            // Ensure no huge objects if not needed
        }));
    } catch (error) {
        console.error("Error fetching all tasks:", error);
        return [];
    }
}

export async function updateTaskStatus(taskId: string, projectId: string | null | undefined, status: string, opportunityId?: string | null) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { status },
        });
        if (projectId) revalidatePath(`/admin/project/${projectId}`);
        if (opportunityId) revalidatePath(`/admin/crm/${opportunityId}`);
        revalidatePath('/admin/crm'); // For global board
        revalidatePath('/admin/project'); // For global board
    } catch (error) {
        console.error("Error updating task status:", error);
        throw error;
    }
}

// ... existing createProjectFromOpportunity ...

// ... existing Milestone Actions ...

// Task actions moved to bottom

export async function createProjectFromOpportunity(opportunityId: string, name: string, code: string, managerId: string, startDate?: Date, endDate?: Date) {
    try {
        const opportunity = await prisma.opportunity.findUnique({
            where: { id: opportunityId },
        });

        if (!opportunity) throw new Error("Opportunity not found");

        let finalManagerId = managerId;
        if (!finalManagerId) {
            const defaultManager = await prisma.user.findFirst({
                where: { role: 'MANAGER' }
            });
            if (defaultManager) {
                finalManagerId = defaultManager.id;
            } else {
                // Fallback to any user if no manager found
                const anyUser = await prisma.user.findFirst();
                if (anyUser) finalManagerId = anyUser.id;
                else throw new Error("No users found to assign as manager");
            }
        }

        const project = await prisma.project.create({
            data: {
                name,
                code,
                description: `Project created from opportunity: ${opportunity.title}`,
                status: 'ACTIVE',
                accountId: opportunity.accountId,
                managerId: finalManagerId,
                startDate,
                endDate,
                budget: Number(opportunity.estimatedValue),
            }
        });

        // Update opportunity stage to CLOSED_WON if not already
        await prisma.opportunity.update({
            where: { id: opportunityId },
            data: { stage: 'CLOSED_WON' }
        });

        return project;
    } catch (error) {
        console.error("Error creating project from opportunity:", error);
        throw error;
    }
}

// Milestone Actions
export async function createMilestone(projectId: string, data: { name: string; dueDate: Date | null; amount: number }) {
    try {
        await prisma.milestone.create({
            data: {
                projectId,
                name: data.name,
                dueDate: data.dueDate,
                amount: data.amount,
                isPaid: false,
            }
        });
        revalidatePath(`/admin/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error creating milestone:", error);
        return { success: false, error: "Failed to create milestone" };
    }
}

export async function updateMilestone(id: string, projectId: string, data: { name: string; dueDate: Date | null; amount: number }) {
    try {
        await prisma.milestone.update({
            where: { id },
            data: {
                name: data.name,
                dueDate: data.dueDate,
                amount: data.amount,
            }
        });
        revalidatePath(`/admin/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating milestone:", error);
        return { success: false, error: "Failed to update milestone" };
    }
}

export async function deleteMilestone(id: string, projectId: string) {
    try {
        await prisma.milestone.delete({
            where: { id }
        });
        revalidatePath(`/admin/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting milestone:", error);
        return { success: false, error: "Failed to delete milestone" };
    }
}

export async function toggleMilestonePayment(id: string, projectId: string, isPaid: boolean) {
    try {
        await prisma.milestone.update({
            where: { id },
            data: { isPaid }
        });
        revalidatePath(`/admin/project/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error toggling payment:", error);
        return { success: false, error: "Failed to toggle payment" };
    }
}

// Project CRUD Actions
export async function getProjectFormData() {
    try {
        const [accounts, managers, serviceAreas] = await Promise.all([
            prisma.account.findMany({ select: { id: true, name: true } }),
            prisma.user.findMany({
                where: {
                    role: {
                        in: ['MANAGER', 'ADMIN']
                    }
                },
                select: { id: true, name: true }
            }),
            prisma.serviceArea.findMany({ select: { id: true, name: true } }) // Fetch service areas
        ]);
        return { accounts, managers, serviceAreas };
    } catch (error) {
        console.error("Error fetching form data:", error);
        return { accounts: [], managers: [], serviceAreas: [] };
    }
}

export async function createProject(data: {
    name: string;
    accountId?: string;
    managerId?: string;
    status: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    serviceAreaId?: string;
}) {
    // Generate code (Simple PRJ-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = `PRJ-${dateStr}-${random}`;

    try {
        await prisma.project.create({
            data: {
                name: data.name,
                code,
                accountId: data.accountId,
                managerId: data.managerId,
                status: data.status,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                budget: data.budget,
                serviceAreaId: data.serviceAreaId,
            }
        });
        revalidatePath('/admin/project');
        return { success: true };
    } catch (error) {
        console.error("Error creating project:", error);
        return { success: false, error: "Failed to create project" };
    }
}

export async function updateProject(id: string, data: {
    name: string;
    accountId?: string | null;
    managerId?: string | null;
    status: string;
    description?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    budget?: number;
    serviceAreaId?: string | null;
}) {
    try {
        await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                accountId: data.accountId,
                managerId: data.managerId,
                status: data.status,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                budget: data.budget,
                serviceAreaId: data.serviceAreaId,
            }
        });
        revalidatePath('/admin/project');
        revalidatePath(`/admin/project/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating project:", error);
        return { success: false, error: "Failed to update project" };
    }
}
// Task Actions
export async function getTaskFormData(projectId?: string) {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true }
        });

        let tasks: { id: string; title: string }[] = [];
        if (projectId) {
            tasks = await prisma.task.findMany({
                where: { projectId },
                select: { id: true, title: true },
                orderBy: { title: 'asc' }
            });
        }

        return { users, tasks };
    } catch (error) {
        console.error("Error fetching task form data:", error);
        return { users: [], tasks: [] };
    }
}

export async function updateTask(id: string, projectId: string | null | undefined, data: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeId?: string;
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    parentId?: string;
    opportunityId?: string;
}) {
    try {
        console.log("Updating task:", id, data);
        await prisma.task.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId || null,
                startDate: data.startDate,
                dueDate: data.dueDate,
                estimatedHours: data.estimatedHours,
                parentId: data.parentId || null,
            }
        });
        if (projectId) revalidatePath(`/admin/project/${projectId}`);
        if (data.opportunityId) revalidatePath(`/admin/crm/${data.opportunityId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating task:", error);
        return { success: false, error: "Failed to update task" };
    }
}

export async function createTask(projectId: string | undefined, data: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeId?: string;
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    parentId?: string;
    opportunityId?: string;
}) {
    try {
        console.log("Creating task:", projectId, data);
        await prisma.task.create({
            data: {
                projectId: projectId ?? undefined,
                // courseId removed
                opportunityId: data.opportunityId || undefined,
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId || null,
                startDate: data.startDate,
                dueDate: data.dueDate,
                estimatedHours: data.estimatedHours,
                parentId: data.parentId || null,
            }
        });
        if (projectId) revalidatePath(`/admin/project/${projectId}`);
        if (data.opportunityId) revalidatePath(`/admin/crm/${data.opportunityId}`);
        return { success: true };
    } catch (error) {
        console.error("Error creating task:", error);
        return { success: false, error: "Failed to create task" };
    }
}

export async function archiveProject(id: string) {
    try {
        await prisma.project.update({
            where: { id },
            data: { status: 'ARCHIVED' }
        });
        revalidatePath('/admin/project');
        return { success: true };
    } catch (error) {
        console.error("Error archiving project:", error);
        return { success: false, error: "Failed to archive project" };
    }
}

export async function deleteProject(id: string) {
    try {
        // 1. Delete Expenses
        await prisma.expense.deleteMany({ where: { projectId: id } });

        // 2. Find all tasks to delete their timesheets
        const tasks = await prisma.task.findMany({
            where: { projectId: id },
            select: { id: true }
        });
        const taskIds = tasks.map(t => t.id);

        // 3. Delete Timesheets associated with these tasks
        if (taskIds.length > 0) {
            await prisma.timesheetEntry.deleteMany({
                where: { taskId: { in: taskIds } }
            });
        }

        // 4. Delete Tasks
        await prisma.task.deleteMany({ where: { projectId: id } });

        // 5. Delete Milestones
        await prisma.milestone.deleteMany({ where: { projectId: id } });

        // 6. Delete Allocations
        await prisma.allocation.deleteMany({ where: { projectId: id } });

        // 7. Delete Project
        await prisma.project.delete({ where: { id } });

        revalidatePath('/admin/project');
        return { success: true };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, error: "Failed to delete project." };
    }
}
