'use server';

import prisma from '@/lib/prisma';

export type FunnelStage = {
    stage: string;
    count: number;
    value: number;
    weightedValue: number;
};

export type SalesStats = {
    totalValue: number;
    weightedValue: number;
    totalCount: number;
    winRate: number;
    funnel: FunnelStage[];
};

export async function getSalesStats() {
    try {
        const opportunities = await prisma.opportunity.findMany({
            where: {
                stage: { not: 'CLOSED_LOST' } // Generally we look at active pipeline + won
            }
        });

        const stats: SalesStats = {
            totalValue: 0,
            weightedValue: 0,
            totalCount: opportunities.length,
            winRate: 0,
            funnel: []
        };

        // Initialize funnel stages
        const stages = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
        const stageMap = new Map<string, FunnelStage>();

        stages.forEach(s => {
            stageMap.set(s, { stage: s, count: 0, value: 0, weightedValue: 0 });
        });

        let wonCount = 0;
        let closedCount = 0; // Won + Lost (if we included lost)

        opportunities.forEach(opp => {
            const val = Number(opp.estimatedValue);
            const prob = opp.probability / 100;
            const weighted = val * prob;

            stats.totalValue += val;
            stats.weightedValue += weighted;

            if (stageMap.has(opp.stage)) {
                const s = stageMap.get(opp.stage)!;
                s.count++;
                s.value += val;
                s.weightedValue += weighted;
            }

            if (opp.stage === 'CLOSED_WON') wonCount++;
        });

        // Simple Win Rate: Won / Total (This is a simplified metric, usually it's Won / (Won + Lost))
        // Since we filtered out CLOSED_LOST above, let's fetch ALL for win rate calc
        const allOpps = await prisma.opportunity.count();
        const lostOpps = await prisma.opportunity.count({ where: { stage: 'CLOSED_LOST' } });
        const wonOpps = await prisma.opportunity.count({ where: { stage: 'CLOSED_WON' } });

        const closedTotal = wonOpps + lostOpps;
        stats.winRate = closedTotal > 0 ? (wonOpps / closedTotal) * 100 : 0;

        stats.funnel = Array.from(stageMap.values());

        return stats;

    } catch (error) {
        console.error("Error fetching sales stats:", error);
        return {
            totalValue: 0,
            weightedValue: 0,
            totalCount: 0,
            winRate: 0,
            funnel: []
        };
    }
}
