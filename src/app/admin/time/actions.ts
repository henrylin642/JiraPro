'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUserTasks(userId: string) {
    try {
        // Fetch tasks assigned to use or recently logged against
        const tasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
                status: { not: 'DONE' }
            },
            include: {
                project: true,
                milestone: true
            }
        });
        return tasks;
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        return [];
    }
}

export type TimesheetData = {
    taskId: string;
    date: Date;
    hours: number;
    description?: string;
};

export async function getTimesheet(userId: string, startDate: Date, endDate: Date) {
    try {
        const entries = await prisma.timesheetEntry.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                task: {
                    include: {
                        project: true
                    }
                }
            }
        });

        // Serialize decimals
        return entries.map(e => ({
            ...e,
            hours: Number(e.hours),
            costRate: Number(e.costRate),
            billableRate: Number(e.billableRate),
        }));
    } catch (error) {
        console.error("Error fetching timesheet:", error);
        return [];
    }
}

export async function saveTimesheet(userId: string, entries: TimesheetData[]) {
    try {
        // Find user rates for snapshot
        const userProfile = await prisma.resourceProfile.findUnique({
            where: { userId }
        });

        const costRate = userProfile?.costRate ? Number(userProfile.costRate) : 0;
        const billableRate = userProfile?.billableRate ? Number(userProfile.billableRate) : 0;

        for (const entry of entries) {
            // Check if exists
            const existing = await prisma.timesheetEntry.findFirst({
                where: {
                    userId,
                    taskId: entry.taskId,
                    date: entry.date
                }
            });

            if (entry.hours <= 0) {
                // Delete if hours are 0 or less
                if (existing) {
                    await prisma.timesheetEntry.delete({ where: { id: existing.id } });
                }
                continue;
            }

            if (existing) {
                await prisma.timesheetEntry.update({
                    where: { id: existing.id },
                    data: {
                        hours: entry.hours,
                        description: entry.description,
                        costRate, // Update snapshot rate on edit to allow corrections
                        billableRate,
                    }
                });
            } else {
                await prisma.timesheetEntry.create({
                    data: {
                        userId,
                        taskId: entry.taskId,
                        date: entry.date,
                        hours: entry.hours,
                        description: entry.description,
                        costRate,
                        billableRate,
                    }
                });
            }
        }

        revalidatePath('/admin/time');
        return { success: true };
    } catch (error) {
        console.error("Error saving timesheet:", error);
        return { success: false, error: "Failed to save timesheet" };
    }
}
