import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateStageAndProbability } from './checklist-logic';

describe('calculateStageAndProbability', () => {
  test('Empty checklist should return LEAD stage and base probability', () => {
    const result = calculateStageAndProbability([]);
    assert.strictEqual(result.stage, 'LEAD');
    assert.strictEqual(result.probability, 10); // BASE_PROBABILITIES['LEAD']
  });

  test('Checklist with LEAD items should return LEAD stage and increased probability', () => {
    // LEAD has base 10. LEAD_BG_CHECK weight is 5.
    const checklist = ['LEAD_BG_CHECK'];
    const result = calculateStageAndProbability(checklist);
    assert.strictEqual(result.stage, 'LEAD');
    assert.strictEqual(result.probability, 15);
  });

  test('Checklist with QUALIFICATION items should promote to QUALIFICATION', () => {
    // QUALIFICATION has base 10. BANT_BUDGET weight is 10.
    const checklist = ['BANT_BUDGET'];
    const result = calculateStageAndProbability(checklist);
    assert.strictEqual(result.stage, 'QUALIFICATION');
    assert.strictEqual(result.probability, 20);
  });

  test('Checklist with items from multiple stages should pick highest stage', () => {
    // LEAD_BG_CHECK (LEAD) + BANT_BUDGET (QUALIFICATION)
    // Highest is QUALIFICATION.
    // Prob = Base(QUALIFICATION) + weight(LEAD_BG_CHECK) + weight(BANT_BUDGET)
    // Prob = 10 + 5 + 10 = 25
    const checklist = ['LEAD_BG_CHECK', 'BANT_BUDGET'];
    const result = calculateStageAndProbability(checklist);
    assert.strictEqual(result.stage, 'QUALIFICATION');
    assert.strictEqual(result.probability, 25);
  });

  test('Probability should be capped at 100', () => {
    // Make a checklist with many high weight items to exceed 100
    // NEGOTIATION base is 70.
    // Add items:
    // NEG_LEGAL (10)
    // NEG_PRICE (10)
    // NEG_CONTRACT (10)
    // WON_SIGNED (10) -> promotes to CLOSED_WON? No, check below.
    // Wait, if WON_SIGNED is checked, stage becomes CLOSED_WON, probability becomes 100 forced.

    // Let's try staying in NEGOTIATION but add enough weight.
    // NEGOTIATION base 70.
    // Add BANT_BUDGET (10), BANT_AUTHORITY (10), BANT_NEED (10), BANT_TIMING (10) -> +40
    // Total 110. Should cap at 100.
    // And stay in NEGOTIATION if we pick an item from NEGOTIATION as highest.

    const checklist = [
        'NEG_LEGAL', // Forces NEGOTIATION
        'BANT_BUDGET', 'BANT_AUTHORITY', 'BANT_NEED', 'BANT_TIMING' // +40 weight
    ];
    // Base 70 + 10 (NEG_LEGAL) + 40 = 120

    const result = calculateStageAndProbability(checklist);
    assert.strictEqual(result.stage, 'NEGOTIATION');
    assert.strictEqual(result.probability, 100);
  });

  test('CLOSED_WON should force probability to 100', () => {
    const checklist = ['WON_SIGNED'];
    const result = calculateStageAndProbability(checklist);
    assert.strictEqual(result.stage, 'CLOSED_WON');
    assert.strictEqual(result.probability, 100);
  });

  test('CLOSED_LOST should force probability to 0', () => {
    const checklist = ['LOST_POST_MORTEM'];
    const result = calculateStageAndProbability(checklist);
    assert.strictEqual(result.stage, 'CLOSED_LOST');
    assert.strictEqual(result.probability, 0);
  });

  test('CLOSED_LOST should take precedence if checked (based on STAGE_ORDER)', () => {
      // If we have items from CLOSED_WON and CLOSED_LOST, CLOSED_LOST wins because it's last in STAGE_ORDER
      const checklist = ['WON_SIGNED', 'LOST_POST_MORTEM'];
      const result = calculateStageAndProbability(checklist);
      assert.strictEqual(result.stage, 'CLOSED_LOST');
      assert.strictEqual(result.probability, 0);
  });
});
