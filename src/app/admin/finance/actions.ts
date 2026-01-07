'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type FinancialValues = {
    budget: number;
    invoiced: number;
    actualCost: number;
    margin: number;
    marginPercent: number;
};

export type ProjectFinancials = {
    id: string;
    name: string;
    code: string | null;
    status: string;
    financials: FinancialValues;
};

export async function getFinancialSummary() {
    try {
        const projects = await prisma.project.findMany({
            where: {
                status: { not: 'CANCELLED' }
            },
            include: {
                milestones: true,
                expenses: true,
                tasks: {
                    include: {
                        timesheets: true
                    }
                }
            }
        });

        const summary: FinancialValues = {
            budget: 0,
            invoiced: 0,
            actualCost: 0,
            margin: 0,
            marginPercent: 0
        };

        const projectFinancials: ProjectFinancials[] = [];

        for (const project of projects) {
            const budget = project.milestones.reduce((sum, m) => sum + Number(m.amount), 0);
            const invoiced = project.milestones
                .filter(m => m.isPaid)
                .reduce((sum, m) => sum + Number(m.amount), 0);

            // Calculate Actual Cost from Timesheets and Expenses
            let actualCost = 0;

            // 1. Timesheet Costs
            project.tasks.forEach(task => {
                task.timesheets.forEach(entry => {
                    actualCost += Number(entry.hours) * Number(entry.costRate);
                });
            });

            // 2. Expense Costs
            if (project.expenses) {
                project.expenses.forEach(expense => {
                    actualCost += Number(expense.amount);
                });
            }

            const margin = budget - actualCost; // Margin based on Budget vs Cost? Or Invoiced vs Cost? 
            // Usually Margin = Revenue (Invoiced or Budget) - Cost. 
            // Let's use Budget for "Projected Margin" and differentiate Invoiced if needed.
            // For now, Margin = Budget - Cost (Project Profitability).

            const marginPercent = budget > 0 ? (margin / budget) * 100 : 0;

            // Aggregate
            summary.budget += budget;
            summary.invoiced += invoiced;
            summary.actualCost += actualCost;

            projectFinancials.push({
                id: project.id,
                name: project.name,
                code: project.code,
                status: project.status,
                financials: {
                    budget,
                    invoiced,
                    actualCost,
                    margin,
                    marginPercent
                }
            });
        }

        // Final Summary Margin
        summary.margin = summary.budget - summary.actualCost;
        summary.marginPercent = summary.budget > 0 ? (summary.margin / summary.budget) * 100 : 0;

        return { summary, projects: projectFinancials };
    } catch (error) {
        console.error("Error fetching financial summary:", error);
        return {
            summary: { budget: 0, invoiced: 0, actualCost: 0, margin: 0, marginPercent: 0 },
            projects: []
        };
    }
}
