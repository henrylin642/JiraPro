'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type OpportunityWithAccount = {
    id: string;
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number; // Decimal is serialized to number/string usually, but we'll handle it
    account: {
        name: string;
    };
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
            },
        });

        // Serialize Decimal to number for client components
        return opportunities.map((opp) => ({
            ...opp,
            estimatedValue: Number(opp.estimatedValue),
        }));
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return [];
    }
}


export async function updateOpportunityStage(id: string, newStage: string, lossReason?: string) {
    await prisma.opportunity.update({
        where: { id },
        data: {
            stage: newStage,
            lossReason: newStage === 'CLOSED_LOST' ? lossReason : null,
            probability: newStage === 'CLOSED_WON' ? 100 : newStage === 'CLOSED_LOST' ? 0 : undefined
        },
    });
    revalidatePath('/admin/crm');
}

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

export async function getOpportunityById(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: {
            account: true,
            owner: { select: { id: true, name: true } },
            allocations: {
                include: {
                    resource: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
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
    };
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


export async function createOpportunity(data: {
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number;
    accountId: string;
    expectedCloseDate?: Date;
    ownerId?: string;
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
}) {
    try {
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


import { STAGE_CHECKLISTS, BASE_PROBABILITIES } from '@/lib/crm-constants';

export async function updateOpportunityChecklist(id: string, checklist: string[]) {
    try {
        // Fetch current opportunity to get the stage
        const opportunity = await prisma.opportunity.findUnique({
            where: { id },
            select: { stage: true }
        });

        if (!opportunity) throw new Error("Opportunity not found");

        // Calculate new probability
        const stage = opportunity.stage;
        let probability = BASE_PROBABILITIES[stage] || 0;

        // Find all checked items configurations
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

        // Special case: If stage is CLOSED_WON, prob is always 100. CLOSED_LOST is 0.
        if (stage === 'CLOSED_WON') probability = 100;
        if (stage === 'CLOSED_LOST') probability = 0;

        await prisma.opportunity.update({
            where: { id },
            data: {
                checklist: JSON.stringify(checklist),
                probability: probability
            },
        });

        revalidatePath('/admin/crm');
        revalidatePath(`/admin/crm/${id}`);
        return { success: true, probability };
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
