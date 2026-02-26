import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatNumberInput } from './format';

describe('formatNumberInput', () => {
    test('should return empty string for empty input', () => {
        assert.strictEqual(formatNumberInput(''), '');
    });

    test('should format simple integer', () => {
        assert.strictEqual(formatNumberInput('123'), '123');
    });

    test('should format integer with commas', () => {
        assert.strictEqual(formatNumberInput('1234'), '1,234');
    });

    test('should format decimal number', () => {
        assert.strictEqual(formatNumberInput('1234.56'), '1,234.56');
    });

    test('should remove non-digit characters', () => {
        assert.strictEqual(formatNumberInput('abc'), '');
        assert.strictEqual(formatNumberInput('a1b2c3d4'), '1,234');
    });

    test('should handle input starting with decimal point', () => {
        assert.strictEqual(formatNumberInput('.5'), '0.5');
    });

    test('should handle multiple decimal points by keeping the first one', () => {
        assert.strictEqual(formatNumberInput('1.2.3'), '1.2');
    });

    test('should remove leading zeros', () => {
        assert.strictEqual(formatNumberInput('05'), '5');
    });

    test('should handle input with only decimal point', () => {
        assert.strictEqual(formatNumberInput('.'), '0.');
    });

    test('should format large numbers correctly', () => {
        assert.strictEqual(formatNumberInput('1000000'), '1,000,000');
    });

    test('should handle undefined or null input gracefully (if type check bypassed)', () => {
        // @ts-expect-error Testing runtime behavior for non-string input
        assert.strictEqual(formatNumberInput(undefined), '');
        // @ts-expect-error Testing runtime behavior for non-string input
        assert.strictEqual(formatNumberInput(null), '');
    });
});
