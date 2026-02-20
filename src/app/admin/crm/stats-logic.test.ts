import { test } from 'node:test';
import assert from 'node:assert';
import { calculateWinLossStats, ClosedOpportunity } from './stats-logic';

test('calculateWinLossStats aggregates correctly', () => {
    const opportunities: ClosedOpportunity[] = [
        { stage: 'CLOSED_WON', lossReason: null },
        { stage: 'CLOSED_WON', lossReason: 'Should not count' }, // Loss reason on won deal should be ignored
        { stage: 'CLOSED_LOST', lossReason: 'Price' },
        { stage: 'CLOSED_LOST', lossReason: 'Price' },
        { stage: 'CLOSED_LOST', lossReason: 'Features' },
        { stage: 'CLOSED_LOST', lossReason: null }, // Lost without reason
    ];

    const stats = calculateWinLossStats(opportunities);

    assert.strictEqual(stats.won, 2);
    assert.strictEqual(stats.lost, 4);
    assert.deepStrictEqual(stats.reasons, {
        'Price': 2,
        'Features': 1
    });
});

test('calculateWinLossStats handles empty input', () => {
    const stats = calculateWinLossStats([]);
    assert.strictEqual(stats.won, 0);
    assert.strictEqual(stats.lost, 0);
    assert.deepStrictEqual(stats.reasons, {});
});

test('calculateWinLossStats handles all won', () => {
    const opportunities: ClosedOpportunity[] = [
        { stage: 'CLOSED_WON', lossReason: null },
        { stage: 'CLOSED_WON', lossReason: null },
    ];
    const stats = calculateWinLossStats(opportunities);
    assert.strictEqual(stats.won, 2);
    assert.strictEqual(stats.lost, 0);
    assert.deepStrictEqual(stats.reasons, {});
});

test('calculateWinLossStats handles all lost', () => {
    const opportunities: ClosedOpportunity[] = [
        { stage: 'CLOSED_LOST', lossReason: 'A' },
        { stage: 'CLOSED_LOST', lossReason: 'B' },
    ];
    const stats = calculateWinLossStats(opportunities);
    assert.strictEqual(stats.won, 0);
    assert.strictEqual(stats.lost, 2);
    assert.deepStrictEqual(stats.reasons, { 'A': 1, 'B': 1 });
});
