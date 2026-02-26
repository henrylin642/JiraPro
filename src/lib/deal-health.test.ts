import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDealHealth, DealHealthInput } from '@/lib/deal-health';
import { STAGE_CHECKLISTS, BASE_PROBABILITIES } from '@/lib/crm-constants';

// Helper to create dates relative to now in days
const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
};

describe('calculateDealHealth', () => {
    // 1. Base Case
    it('should return default health for minimal input', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
        };
        const result = calculateDealHealth(input);

        assert.ok(result);
        assert.strictEqual(typeof result.score, 'number');
        assert.ok(result.score >= 0 && result.score <= 100);
        assert.strictEqual(result.signals.length > 0, true, 'Should have some negative signals for minimal input');
    });

    // 2. Checklist Logic
    it('should increase score with checklist items checked', () => {
        const stage = 'QUALIFICATION';
        const checklistItems = STAGE_CHECKLISTS[stage];
        const item1 = checklistItems[0].id;

        const inputEmpty: DealHealthInput = { stage, checklist: [] };
        const resultEmpty = calculateDealHealth(inputEmpty);

        const inputChecked: DealHealthInput = { stage, checklist: [item1] };
        const resultChecked = calculateDealHealth(inputChecked);

        assert.ok(resultChecked.breakdown.checklistScore > resultEmpty.breakdown.checklistScore, 'Checklist score should increase');
    });

    it('should handle checklist as JSON string', () => {
        const stage = 'QUALIFICATION';
        const item1 = STAGE_CHECKLISTS[stage][0].id;

        const input: DealHealthInput = {
            stage,
            checklist: JSON.stringify([item1])
        };
        const result = calculateDealHealth(input);

        assert.ok(result.breakdown.checklistScore > BASE_PROBABILITIES[stage], 'Should parse JSON checklist');
    });

    // 3. Completeness Logic
    it('should have higher completeness score with more fields filled', () => {
        const inputBase: DealHealthInput = { stage: 'LEAD' };
        const resultBase = calculateDealHealth(inputBase);

        const inputFull: DealHealthInput = {
            stage: 'LEAD',
            ownerId: 'user1',
            expectedCloseDate: daysFromNow(30),
            estimatedValue: 10000,
            serviceAreaId: 'area1',
        };
        const resultFull = calculateDealHealth(inputFull);

        assert.ok(resultFull.breakdown.dataCompletenessScore > resultBase.breakdown.dataCompletenessScore, 'Completeness score should increase');
        assert.strictEqual(resultFull.breakdown.dataCompletenessScore, 100, 'Should be 100% complete');
    });

    // 4. Interaction Logic
    it('should score high for recent interaction', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            lastInteractionAt: daysAgo(2),
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.interactionScore, 100);
    });

    it('should score low for old interaction', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            lastInteractionAt: daysAgo(45),
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.interactionScore, 10);
        assert.ok(result.signals.some(s => s.id === 'no_recent_activity'), 'Should have no_recent_activity signal');
    });

    // 5. Next Steps Logic
    it('should score high for future scheduled task', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            openTasks: [{ dueDate: daysFromNow(5) }],
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.nextStepScore, 100);
    });

    it('should score low if next step is overdue', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            openTasks: [{ dueDate: daysAgo(5) }],
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.nextStepScore, 30);
        assert.ok(result.signals.some(s => s.id === 'next_step_overdue'), 'Should have next_step_overdue signal');
    });

    it('should signal if no next step scheduled', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            openTasks: [],
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.nextStepScore, 0);
        assert.ok(result.signals.some(s => s.id === 'no_next_step'), 'Should have no_next_step signal');
    });

    // 6. Stage Age Logic
    it('should score high for recent stage update', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            stageUpdatedAt: daysAgo(5),
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.stageAgeScore, 100);
    });

    it('should score low for stalled stage', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            stageUpdatedAt: daysAgo(65),
        };
        const result = calculateDealHealth(input);
        assert.strictEqual(result.breakdown.stageAgeScore, 10);
        assert.ok(result.signals.some(s => s.id === 'stage_stalled'), 'Should have stage_stalled signal');
    });

    // 7. Signals
    it('should detect missing owner', () => {
        const input: DealHealthInput = { stage: 'LEAD', ownerId: null };
        const result = calculateDealHealth(input);
        assert.ok(result.signals.some(s => s.id === 'no_owner'));
    });

    it('should detect missing close date', () => {
        const input: DealHealthInput = { stage: 'LEAD', expectedCloseDate: null };
        const result = calculateDealHealth(input);
        assert.ok(result.signals.some(s => s.id === 'no_close_date'));
    });

    it('should detect overdue close date', () => {
        const input: DealHealthInput = {
            stage: 'PROPOSAL',
            expectedCloseDate: daysAgo(1)
        };
        const result = calculateDealHealth(input);
        assert.ok(result.signals.some(s => s.id === 'close_date_overdue'));
    });

    // 8. Recommended Probability
    it('should penalize recommended probability for missing critical info', () => {
        const stage = 'PROPOSAL'; // Base 40
        const input: DealHealthInput = {
            stage,
            checklist: [], // Base probability
            // Missing owner, close date, interaction, next steps
        };
        const result = calculateDealHealth(input);
        // Base 40
        // -10 (no owner)
        // -5 (no close date)
        // -10 (no recent interaction)
        // -10 (no next step)
        // Total penalty: -35 => Recommended ~5 (clamped 0-100)

        assert.ok(result.recommendedProbability < BASE_PROBABILITIES[stage], 'Recommended probability should be penalized');
    });

    // 9. Edge Cases
    it('should handle invalid dates gracefully', () => {
        const input: DealHealthInput = {
            stage: 'LEAD',
            expectedCloseDate: 'invalid-date',
            lastInteractionAt: 'invalid-date',
            stageUpdatedAt: 'invalid-date',
        };
        const result = calculateDealHealth(input);
        assert.ok(result.score >= 0);
        // Should treat as null dates
        assert.strictEqual(result.lastInteractionDays, null);
        assert.strictEqual(result.stageAgeDays, null);
    });
});
