import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateOpportunityCreation } from './validation';

describe('validateOpportunityCreation', () => {
    const baseData = {
        title: 'Test Opportunity',
        stage: 'LEAD',
        estimatedValue: 1000,
        accountId: 'acc-123',
        // Provide required fields to avoid extra penalties where possible,
        // although calculateDealHealth penalizes for missing interactions/tasks which we can't easily provide here as they are hardcoded to empty/null in the function.
        ownerId: 'user-1',
        serviceAreaId: 'area-1',
        // Future date
        expectedCloseDate: new Date(Date.now() + 86400000 * 30),
    };

    // Based on analysis:
    // checklistScore = 10 (LEAD base)
    // penalties: -10 (no interaction), -10 (no tasks)
    // recommendedProbability = 10 - 10 - 10 = -10 -> clamped to 0.

    it('should pass validation when probability gap is small (< 20)', () => {
        const result = validateOpportunityCreation({
            ...baseData,
            probability: 10, // Gap |0 - 10| = 10 < 20
        });
        assert.ok(result.success, 'Validation should pass for small gap');
    });

    it('should fail validation when probability gap is large (>= 20) without reason', () => {
        const result = validateOpportunityCreation({
            ...baseData,
            probability: 30, // Gap |0 - 30| = 30 >= 20
        });
        assert.strictEqual(result.success, false, 'Validation should fail for large gap without reason');
        assert.strictEqual(result.error, 'PROBABILITY_REASON_REQUIRED');
    });

    it('should pass validation when probability gap is large (>= 20) WITH reason', () => {
        const result = validateOpportunityCreation({
            ...baseData,
            probability: 30,
            probabilityOverrideReason: 'Manual override because I know better',
        });
        assert.ok(result.success, 'Validation should pass for large gap with reason');
    });

    it('should handle whitespace-only reason as invalid', () => {
        const result = validateOpportunityCreation({
            ...baseData,
            probability: 30,
            probabilityOverrideReason: '   ',
        });
        assert.strictEqual(result.success, false, 'Validation should fail for whitespace reason');
        assert.strictEqual(result.error, 'PROBABILITY_REASON_REQUIRED');
    });
});
