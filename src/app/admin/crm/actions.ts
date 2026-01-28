'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { calculateDealHealth } from '@/lib/deal-health';

export type OpportunityWithAccount = {
    id: string;
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number; // Decimal is serialized to number/string usually, but we'll handle it
    account: {
        name: string;
    };
    healthScore?: number;
};

export async function getOpportunities() {
    try {
        const opportunities = await prisma.opportunity.findMany({
            include: {
                account: {
                    select: { name: true },
                },
                owner: {
                    select: { id: true, name: true },
                },
                serviceArea: true,
                interactions: {
                    select: { date: true },
                    orderBy: { date: 'desc' },
                    take: 1,
                },
                tasks: {
                    where: { status: { not: 'DONE' } },
                    select: { dueDate: true },
                },
            },
        });

        // Serialize Decimal to number for client components
        return opportunities.map((opp) => {
            const { interactions, tasks, ...rest } = opp;
            const estimatedValue = Number(opp.estimatedValue);
            const lastInteractionAt = interactions[0]?.date ?? null;
            const health = calculateDealHealth({
                stage: opp.stage,
                checklist: opp.checklist,
                ownerId: opp.ownerId,
                expectedCloseDate: opp.expectedCloseDate,
                estimatedValue,
                serviceAreaId: opp.serviceAreaId,
                stageUpdatedAt: opp.stageUpdatedAt ?? opp.updatedAt,
                lastInteractionAt,
                openTasks: tasks,
                currentProbability: opp.probability,
            });

            return {
                ...rest,
                estimatedValue,
                healthScore: health.score,
                healthSignals: health.signals,
                recommendedProbability: health.recommendedProbability,
                probabilityDelta: health.probabilityDelta,
            };
        });
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return [];
    }
}

// ... existing code ...

export async function getOpportunityById(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: {
            account: true,
            owner: { select: { id: true, name: true } },
            serviceArea: true,
            allocations: {
                include: {
                    resource: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
            tasks: {
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
            }
        },
    });

    if (!opportunity) return null;

    return {
        ...opportunity,
        estimatedValue: Number(opportunity.estimatedValue),
        allocations: opportunity.allocations.map((alloc) => ({
            ...alloc,
            resource: {
                ...alloc.resource,
                costRate: Number(alloc.resource.costRate),
                billableRate: Number(alloc.resource.billableRate),
            },
        })),
        tasks: (opportunity as any).tasks || []
    };
}

// ... existing code ...

export async function createOpportunity(data: {
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number;
    accountId: string;
    expectedCloseDate?: Date;
    ownerId?: string;
    serviceAreaId?: string;
}) {
    try {
        const opportunity = await prisma.opportunity.create({
            data: {
                title: data.title,
                stage: data.stage,
                probability: data.probability,
                estimatedValue: data.estimatedValue,
                accountId: data.accountId,
                expectedCloseDate: data.expectedCloseDate,
                ownerId: data.ownerId,
                serviceAreaId: data.serviceAreaId,
            },
        });
        revalidatePath('/admin/crm');

        // Serialize Decimal to number
        return {
            success: true,
            opportunity: {
                ...opportunity,
                estimatedValue: Number(opportunity.estimatedValue)
            }
        };
    } catch (error) {
        console.error("Error creating opportunity:", error);
        return { success: false, error: "Failed to create opportunity" };
    }
}

export async function updateOpportunity(id: string, data: {
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number;
    accountId: string;
    expectedCloseDate?: Date | null;
    ownerId?: string | null;
    serviceAreaId?: string | null;
}) {
    try {
        const current = await prisma.opportunity.findUnique({
            where: { id },
            select: { stage: true },
        });
        const stageChanged = current?.stage !== data.stage;

        const opportunity = await prisma.opportunity.update({
            where: { id },
            data: {
                title: data.title,
                stage: data.stage,
                probability: data.probability,
                estimatedValue: data.estimatedValue,
                accountId: data.accountId,
                expectedCloseDate: data.expectedCloseDate,
                ownerId: data.ownerId,
                serviceAreaId: data.serviceAreaId,
                stageUpdatedAt: stageChanged ? new Date() : undefined,
            },
        });
        revalidatePath('/admin/crm');
        revalidatePath(`/admin/crm/${id}`);

        return { success: true };
    } catch (error) {
        console.error("Error updating opportunity:", error);
        return { success: false, error: "Failed to update opportunity" };
    }
}


import { STAGE_CHECKLISTS, BASE_PROBABILITIES, STAGE_ORDER } from '@/lib/crm-constants';

export async function getSalesForecast() {
    try {
        const opportunities = await prisma.opportunity.findMany({
            where: {
                stage: { notIn: ['CLOSED_LOST'] },
                expectedCloseDate: { not: null }
            },
            select: {
                expectedCloseDate: true,
                estimatedValue: true,
                probability: true
            }
        });

        // Group by month YYYY-MM
        const forecast: Record<string, number> = {};

        opportunities.forEach(opp => {
            if (!opp.expectedCloseDate) return;
            const month = opp.expectedCloseDate.toISOString().substring(0, 7); // "2023-10"
            const value = Number(opp.estimatedValue);
            const weighedValue = value * (opp.probability / 100);

            forecast[month] = (forecast[month] || 0) + weighedValue;
        });

        // Convert to array and sort
        return Object.entries(forecast)
            .map(([month, value]) => ({ month, value }))
            .sort((a, b) => a.month.localeCompare(b.month));

    } catch (error) {
        console.error("Error fetching sales forecast:", error);
        return [];
    }
}

export async function getWinLossStats() {
    try {
        const closedOpps = await prisma.opportunity.findMany({
            where: {
                stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] }
            },
            select: {
                stage: true,
                lossReason: true
            }
        });

        const stats = {
            won: 0,
            lost: 0,
            reasons: {} as Record<string, number>
        };

        closedOpps.forEach(opp => {
            if (opp.stage === 'CLOSED_WON') {
                stats.won++;
            } else {
                stats.lost++;
                if (opp.lossReason) {
                    stats.reasons[opp.lossReason] = (stats.reasons[opp.lossReason] || 0) + 1;
                }
            }
        });

        return stats;
    } catch (error) {
        console.error("Error fetching win/loss stats:", error);
        return { won: 0, lost: 0, reasons: {} };
    }
}

export async function updateOpportunityStage(id: string, newStage: string, lossReason?: string) {
    const existing = await prisma.opportunity.findUnique({
        where: { id },
        select: { stage: true },
    });

    const stageChanged = existing?.stage !== newStage;

    await prisma.opportunity.update({
        where: { id },
        data: {
            stage: newStage,
            lossReason: newStage === 'CLOSED_LOST' ? lossReason : null,
            probability: newStage === 'CLOSED_WON' ? 100 : newStage === 'CLOSED_LOST' ? 0 : undefined,
            stageUpdatedAt: stageChanged ? new Date() : undefined,
        },
    });
    revalidatePath('/admin/crm');
}

export async function deleteOpportunity(id: string) {
    try {
        // Delete related allocations first
        await prisma.allocation.deleteMany({
            where: { opportunityId: id }
        });

        // Delete the opportunity
        await prisma.opportunity.delete({
            where: { id }
        });

        revalidatePath('/admin/crm');
        return { success: true };
    } catch (error) {
        console.error("Error deleting opportunity:", error);
        return { success: false, error: "Failed to delete opportunity" };
    }
}

export async function getResources() {
    const resources = await prisma.resourceProfile.findMany({
        include: {
            user: true,
        },
    });

    return resources.map((res) => ({
        ...res,
        costRate: Number(res.costRate),
        billableRate: Number(res.billableRate),
    }));
}

export async function createAllocation(data: {
    opportunityId: string;
    resourceId: string;
    startDate: Date;
    endDate: Date;
    percentage: number;
}) {
    await prisma.allocation.create({
        data: {
            opportunityId: data.opportunityId,
            resourceId: data.resourceId,
            startDate: data.startDate,
            endDate: data.endDate,
            percentage: data.percentage,
            type: 'SOFT', // Default to SOFT for Opportunities
        },
    });
    revalidatePath(`/admin/crm/${data.opportunityId}`);
}

export async function deleteAllocation(id: string) {
    await prisma.allocation.delete({
        where: { id },
    });
    revalidatePath('/admin/crm');
}


export async function updateOpportunityChecklist(id: string, checklist: string[]) {
    try {
        const current = await prisma.opportunity.findUnique({
            where: { id },
            select: { stage: true },
        });

        // Find the highest stage that has a checked item
        // We iterate in reverse order of STAGE_ORDER (excluding CLOSED_LOST for auto-promotion, maybe?)
        // Let's include all except maybe CLOSED_LOST which is usually manual, but let's follow the rule "Where the check is".
        // If I check "Contract Signed", I am in CLOSED_WON.

        let newStage = 'LEAD'; // Default

        // Check in reverse order (highest stage first)
        // We only consider stages in STAGE_ORDER that are NOT CLOSED_LOST for auto-determination?
        // Actually, if we want "Status is where check is", if I confirm "Post Mortem", am I in CLOSED_LOST?
        // Maybe. Let's include all.

        for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
            const stage = STAGE_ORDER[i];
            const items = STAGE_CHECKLISTS[stage];
            if (!items) continue;

            // If any item in this stage is checked
            const hasCheckedItem = items.some(item => checklist.includes(item.id));
            if (hasCheckedItem) {
                newStage = stage;
                break;
            }
        }

        // Calculate new probability
        let probability = BASE_PROBABILITIES[newStage] || 0;

        // Find all checked items configurations to add weights
        let addedProb = 0;
        Object.values(STAGE_CHECKLISTS).forEach(list => {
            list.forEach(item => {
                if (checklist.includes(item.id)) {
                    addedProb += item.weight;
                }
            });
        });

        // Cap at 100
        probability = Math.min(100, probability + addedProb);

        // Special case overrides
        if (newStage === 'CLOSED_WON') probability = 100;
        if (newStage === 'CLOSED_LOST') probability = 0;

        const stageChanged = current?.stage !== newStage;

        await prisma.opportunity.update({
            where: { id },
            data: {
                checklist: JSON.stringify(checklist),
                stage: newStage,
                probability: probability,
                stageUpdatedAt: stageChanged ? new Date() : undefined,
            },
        });

        revalidatePath('/admin/crm');
        revalidatePath(`/admin/crm/${id}`);
        return { success: true, probability, stage: newStage };
    } catch (error) {
        console.error("Error updating checklist:", error);
        return { success: false, error: "Failed to update checklist" };
    }
}

export async function createInteraction(data: {
    opportunityId: string;
    accountId: string; // Required by schema
    type: string;
    notes: string;
    userId: string;
    date: Date;
}) {
    try {
        await prisma.interaction.create({
            data: {
                opportunityId: data.opportunityId,
                accountId: data.accountId,
                type: data.type,
                notes: data.notes,
                userId: data.userId,
                date: data.date,
            },
        });
        revalidatePath(`/admin/crm/${data.opportunityId}`);
        return { success: true };
    } catch (error) {
        console.error("Error creating interaction:", error);
        return { success: false, error: "Failed to create interaction" };
    }
}

export async function getInteractions(opportunityId: string) {
    try {
        const interactions = await prisma.interaction.findMany({
            where: { opportunityId },
            include: {
                user: true,
            },
            orderBy: { date: 'desc' },
        });
        return interactions;
    } catch (error) {
        console.error("Error fetching interactions:", error);
        return [];
    }
}

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { name: 'asc' },
    });
}

export async function updateInteraction(id: string, data: {
    type: string;
    notes: string;
    userId: string;
    date: Date;
    opportunityId: string; // Used for revalidation
}) {
    try {
        await prisma.interaction.update({
            where: { id },
            data: {
                type: data.type,
                notes: data.notes,
                userId: data.userId,
                date: data.date,
            },
        });
        revalidatePath(`/admin/crm/${data.opportunityId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating interaction:", error);
        return { success: false, error: "Failed to update interaction" };
    }
}

export async function deleteInteraction(id: string, opportunityId: string) {
    try {
        await prisma.interaction.delete({
            where: { id },
        });
        revalidatePath(`/admin/crm/${opportunityId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting interaction:", error);
        return { success: false, error: "Failed to delete interaction" };
    }
}
