import { calculateDealHealth } from '@/lib/deal-health';

export function validateOpportunityCreation(data: {
    stage: string;
    probability: number;
    estimatedValue: number;
    expectedCloseDate?: Date;
    ownerId?: string;
    serviceAreaId?: string;
    probabilityOverrideReason?: string;
}) {
    const trimmedReason = data.probabilityOverrideReason?.trim() || '';
    const health = calculateDealHealth({
        stage: data.stage,
        checklist: [],
        ownerId: data.ownerId,
        expectedCloseDate: data.expectedCloseDate,
        estimatedValue: data.estimatedValue,
        serviceAreaId: data.serviceAreaId,
        stageUpdatedAt: new Date(),
        lastInteractionAt: null,
        openTasks: [],
        currentProbability: data.probability,
    });
    const probabilityGap = Math.abs(health.recommendedProbability - data.probability);

    if (probabilityGap >= 20 && !trimmedReason) {
        return { success: false, error: 'PROBABILITY_REASON_REQUIRED' };
    }
    return { success: true };
}
