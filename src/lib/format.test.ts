import { test } from 'node:test';
import assert from 'node:assert';
import { formatNumber } from './format';

test('formatNumber utility', async (t) => {
    await t.test('handles null and undefined', () => {
        assert.strictEqual(formatNumber(null), '-');
        assert.strictEqual(formatNumber(undefined), '-');
    });

    await t.test('handles valid numbers', () => {
        assert.strictEqual(formatNumber(0), '0');
        assert.strictEqual(formatNumber(100), '100');
        assert.strictEqual(formatNumber(1000), '1,000');
        assert.strictEqual(formatNumber(1234567), '1,234,567');
        assert.strictEqual(formatNumber(-1234.56), '-1,235');
    });

    await t.test('handles numeric strings', () => {
        assert.strictEqual(formatNumber('0'), '0');
        assert.strictEqual(formatNumber('1000'), '1,000');
        assert.strictEqual(formatNumber('1234.56'), '1,235');
    });

    await t.test('handles invalid strings/NaN', () => {
        assert.strictEqual(formatNumber('abc'), '-');
        assert.strictEqual(formatNumber('12.34.56'), '-'); // Double decimal points make it NaN
        assert.strictEqual(formatNumber(NaN), '-');
    });

    await t.test('respects maximumFractionDigits parameter', () => {
        // Default is 0
        assert.strictEqual(formatNumber(1234.567), '1,235');

        // Custom precision
        assert.strictEqual(formatNumber(1234.567, 1), '1,234.6');
        assert.strictEqual(formatNumber(1234.567, 2), '1,234.57');
        assert.strictEqual(formatNumber(1234.567, 3), '1,234.567');
        assert.strictEqual(formatNumber(0.12345, 4), '0.1235');
    });

    await t.test('handles large numbers', () => {
        assert.strictEqual(formatNumber(1e9), '1,000,000,000');
    });
});
