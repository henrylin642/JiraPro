'use server';

import prisma from '@/lib/prisma';
import { getFinancialSummary } from './finance/actions';

export async function getExecutiveStats() {
    try {
        // 1. Finance Stats
        const { summary: finance } = await getFinancialSummary();

        // 2. Project Stats
        const projects = await prisma.project.findMany({
            where: { status: { not: 'CANCELLED' } },
            select: { status: true, budget: true, milestones: true, tasks: { include: { timesheets: true } } }
        });

        const projectStats = {
            total: projects.length,
            active: 0,
            planning: 0,
            completed: 0,
            onHold: 0,
            atRisk: 0
        };

        projects.forEach(p => {
            if (p.status === 'ACTIVE') projectStats.active++;
            else if (p.status === 'PLANNING') projectStats.planning++;
            else if (p.status === 'COMPLETED') projectStats.completed++;
            else if (p.status === 'ON_HOLD') projectStats.onHold++;

            // Calculate margin for "At Risk" (Margin < 20%)
            const budget = Number(p.budget);
            let cost = 0;
            p.tasks.forEach(t => {
                t.timesheets.forEach(entry => {
                    cost += Number(entry.hours) * Number(entry.costRate);
                });
            });
            const margin = budget > 0 ? (budget - cost) / budget : 0;
            if (budget > 0 && margin < 0.2 && p.status === 'ACTIVE') {
                projectStats.atRisk++;
            }
        });

        // 3. Resource Stats
        // Detailed utilization requires date range logic (e.g. current month).
        // For Dashboard, let's show "Capacity vs Allocated" for current active allocations.
        const totalUsers = await prisma.user.count({ where: { role: { not: 'OBSERVER' } } });

        // Simple heuristic: Count users with active allocations today
        const today = new Date();
        const activeAllocations = await prisma.allocation.findMany({
            where: {
                startDate: { lte: today },
                endDate: { gte: today }
            },
            distinct: ['resourceId']
        });

        const resourceStats = {
            totalResources: totalUsers,
            activeCount: activeAllocations.length,
            utilizationRate: totalUsers > 0 ? (activeAllocations.length / totalUsers) * 100 : 0
        };

        // 4. 2026 Quarterly Stats (Projects + Opportunities)
        const quarterlyData = [
            { name: 'Q1', project: 0, opportunity: 0 },
            { name: 'Q2', project: 0, opportunity: 0 },
            { name: 'Q3', project: 0, opportunity: 0 },
            { name: 'Q4', project: 0, opportunity: 0 },
        ];

        // Projects
        const projects2026 = await prisma.project.findMany({
            where: {
                startDate: {
                    gte: new Date('2026-01-01'),
                    lte: new Date('2026-12-31')
                },
                status: { not: 'CANCELLED' }
            },
            select: { startDate: true, budget: true }
        });

        projects2026.forEach(p => {
            if (!p.startDate) return;
            const month = p.startDate.getMonth();
            const budget = Number(p.budget);
            const qIndex = Math.floor(month / 3);
            if (qIndex >= 0 && qIndex <= 3) {
                quarterlyData[qIndex].project += budget;
            }
        });

        // Opportunities
        const opportunities2026 = await prisma.opportunity.findMany({
            where: {
                expectedCloseDate: {
                    gte: new Date('2026-01-01'),
                    lte: new Date('2026-12-31')
                },
                stage: { notIn: ['CLOSED_LOST', 'CLOSED_WON'] } // Only open opportunities? Or all potential? Let's use Open + Won implies 'Project' usually. Let's use Open for "Potential".
            },
            select: { expectedCloseDate: true, estimatedValue: true }
        });

        opportunities2026.forEach(o => {
            if (!o.expectedCloseDate) return;
            const month = o.expectedCloseDate.getMonth();
            const value = Number(o.estimatedValue);
            const qIndex = Math.floor(month / 3);
            if (qIndex >= 0 && qIndex <= 3) {
                quarterlyData[qIndex].opportunity += value;
            }
        });
        const recentMilestones = await prisma.milestone.findMany({
            where: { isPaid: false },
            orderBy: { dueDate: 'asc' },
            take: 5,
            include: { project: true }
        });

        const serializedMilestones = recentMilestones.map(m => ({
            ...m,
            amount: Number(m.amount),
            project: { ...m.project, budget: Number(m.project.budget) }
        }));

        return {
            finance,
            projectStats,
            resourceStats,
            resourceStats,
            quarterlyBudgets2026: quarterlyData,
            recentMilestones: serializedMilestones
        };

    } catch (error) {
        console.error("Error fetching executive stats:", error);
        throw error;
    }
}

export async function getPortfolio() {
    try {
        const [projects, opportunities] = await Promise.all([
            prisma.project.findMany({
                where: { status: { not: 'CANCELLED' } },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    status: true,
                    budget: true,
                    endDate: true,
                }
            }),
            prisma.opportunity.findMany({
                where: { stage: { notIn: ['CLOSED_LOST'] } },
                select: {
                    id: true,
                    title: true,
                    stage: true,
                    estimatedValue: true,
                    probability: true,
                    expectedCloseDate: true,
                }
            })
        ]);

        const portfolioItems = [
            ...projects.map(p => ({
                id: p.id,
                type: 'PROJECT' as const,
                name: p.name,
                code: p.code,
                status: p.status,
                value: Number(p.budget),
                probability: 100, // Projects are already won/active
                weightedValue: Number(p.budget),
                date: p.endDate,
            })),
            ...opportunities.map(o => ({
                id: o.id,
                type: 'OPPORTUNITY' as const,
                name: o.title,
                code: null,
                status: o.stage,
                value: Number(o.estimatedValue),
                probability: o.probability,
                weightedValue: Number(o.estimatedValue) * (o.probability / 100),
                date: o.expectedCloseDate,
            }))
        ];

        // Sort by weighted value descending
        return portfolioItems.sort((a, b) => b.weightedValue - a.weightedValue);

    } catch (error) {
        console.error("Error fetching portfolio:", error);
        return [];
    }
}
