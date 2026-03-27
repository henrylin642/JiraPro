import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateStageAndProbability } from './checklist-logic';

describe('calculateStageAndProbability', () => {
    test('should return default stage LEAD and base probability for empty checklist', () => {
        const result = calculateStageAndProbability([]);
        assert.strictEqual(result.stage, 'LEAD');
        assert.strictEqual(result.probability, 10); // Base for LEAD
    });

    test('should increase probability with checked items in LEAD stage', () => {
        const result = calculateStageAndProbability(['LEAD_BG_CHECK']);
        assert.strictEqual(result.stage, 'LEAD');
        // Base 10 + Weight 5
        assert.strictEqual(result.probability, 15);
    });

    test('should sum weights for multiple items in LEAD stage', () => {
        const result = calculateStageAndProbability(['LEAD_BG_CHECK', 'LEAD_CONTACT']);
        assert.strictEqual(result.stage, 'LEAD');
        // Base 10 + 5 + 5
        assert.strictEqual(result.probability, 20);
    });

    test('should promote stage to QUALIFICATION when qualification item is checked', () => {
        const result = calculateStageAndProbability(['BANT_BUDGET']);
        assert.strictEqual(result.stage, 'QUALIFICATION');
        // Base for QUALIFICATION is 10. Item weight is 10.
        // Total: 10 + 10 = 20
        assert.strictEqual(result.probability, 20);
    });

    test('should set stage based on highest checked item and sum all weights', () => {
        // LEAD_BG_CHECK (5), BANT_BUDGET (10)
        // Stage should be QUALIFICATION (higher than LEAD)
        // Prob: Base QUALIFICATION (10) + 5 + 10 = 25
        const result = calculateStageAndProbability(['LEAD_BG_CHECK', 'BANT_BUDGET']);
        assert.strictEqual(result.stage, 'QUALIFICATION');
        assert.strictEqual(result.probability, 25);
    });

    test('should promote to PROPOSAL and calculate probability', () => {
        // PROP_SENT (10)
        // Base PROPOSAL (40)
        const result = calculateStageAndProbability(['PROP_SENT']);
        assert.strictEqual(result.stage, 'PROPOSAL');
        assert.strictEqual(result.probability, 50);
    });

    test('should promote to NEGOTIATION and calculate probability', () => {
        // NEG_LEGAL (10)
        // Base NEGOTIATION (70)
        const result = calculateStageAndProbability(['NEG_LEGAL']);
        assert.strictEqual(result.stage, 'NEGOTIATION');
        assert.strictEqual(result.probability, 80);
    });

    test('should cap probability at 100', () => {
        // Base NEGOTIATION (70)
        // Items: NEG_LEGAL (10), NEG_PRICE (10), NEG_CONTRACT (10), PROP_SENT (10)
        // Sum: 70 + 10 + 10 + 10 + 10 = 110 -> Should be 100
        const checklist = ['NEG_LEGAL', 'NEG_PRICE', 'NEG_CONTRACT', 'PROP_SENT'];
        const result = calculateStageAndProbability(checklist);
        assert.strictEqual(result.stage, 'NEGOTIATION');
        assert.strictEqual(result.probability, 100);
    });

    test('should override probability to 100 for CLOSED_WON', () => {
        // WON_SIGNED (10)
        // Base CLOSED_WON (100)
        // Even without base, the function has an override
        const result = calculateStageAndProbability(['WON_SIGNED']);
        assert.strictEqual(result.stage, 'CLOSED_WON');
        assert.strictEqual(result.probability, 100);
    });

    test('should override probability to 0 for CLOSED_LOST', () => {
        // LOST_POST_MORTEM (0)
        // Base CLOSED_LOST (0)
        // Just to be sure, let's add some other items that would increase prob if not for the override?
        // But stage is determined by highest checked item.
        // If I have WON_SIGNED (CLOSED_WON) and LOST_POST_MORTEM (CLOSED_LOST),
        // CLOSED_LOST is usually last in STAGE_ORDER so it might win depending on order.

        // STAGE_ORDER = [..., 'CLOSED_WON', 'CLOSED_LOST']
        // So CLOSED_LOST is higher index.

        const result = calculateStageAndProbability(['WON_SIGNED', 'LOST_POST_MORTEM']);
        assert.strictEqual(result.stage, 'CLOSED_LOST');
        assert.strictEqual(result.probability, 0);
    });
});
