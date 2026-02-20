
export type ClosedOpportunity = {
    stage: string;
    lossReason: string | null;
};

export type WinLossStats = {
    won: number;
    lost: number;
    reasons: Record<string, number>;
};

export function calculateWinLossStats(opportunities: ClosedOpportunity[]): WinLossStats {
    const stats: WinLossStats = {
        won: 0,
        lost: 0,
        reasons: {}
    };

    opportunities.forEach(opp => {
        if (opp.stage === 'CLOSED_WON') {
            stats.won++;
        } else {
            // Assume any other stage in this context is lost,
            // but the original code specifically checked 'else' which implies 'CLOSED_LOST'
            // given the query filtered for strictly WON or LOST.
            stats.lost++;
            if (opp.lossReason) {
                stats.reasons[opp.lossReason] = (stats.reasons[opp.lossReason] || 0) + 1;
            }
        }
    });

    return stats;
}
