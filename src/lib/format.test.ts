import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
    // Default cases (TWD, 0 fraction digits)
    it('should format number correctly with default currency (TWD)', () => {
        assert.strictEqual(formatCurrency(1000), 'NT$1,000');
    });

    it('should format string number correctly', () => {
        assert.strictEqual(formatCurrency('1000'), 'NT$1,000');
    });

    it('should handle decimal number with default settings (rounds)', () => {
        assert.strictEqual(formatCurrency(1000.5), 'NT$1,001');
    });

    // Null/Undefined/NaN handling
    it('should handle null', () => {
        assert.strictEqual(formatCurrency(null), '-');
    });

    it('should handle undefined', () => {
        assert.strictEqual(formatCurrency(undefined), '-');
    });

    it('should handle invalid string number (alphanumeric)', () => {
        assert.strictEqual(formatCurrency('abc'), '-');
    });

    it('should handle string with commas as invalid (NaN)', () => {
        assert.strictEqual(formatCurrency('1,000'), '-');
    });

    it('should handle empty string as 0', () => {
        assert.strictEqual(formatCurrency(''), 'NT$0');
    });

    // Custom currency
    it('should format with custom currency (USD)', () => {
        assert.strictEqual(formatCurrency(1000, 'USD'), '$1,000');
    });

    it('should format with custom currency (EUR)', () => {
        assert.strictEqual(formatCurrency(1000, 'EUR'), '€1,000');
    });

    // Custom fraction digits
    it('should format with custom fraction digits', () => {
        assert.strictEqual(formatCurrency(1000.5, 'USD', 2), '$1,000.50');
    });

    it('should format with custom fraction digits (rounding)', () => {
        assert.strictEqual(formatCurrency(1000.123, 'USD', 2), '$1,000.12');
        assert.strictEqual(formatCurrency(1000.129, 'USD', 2), '$1,000.13');
    });

    // Large and negative numbers
    it('should handle large numbers', () => {
        assert.strictEqual(formatCurrency(1000000), 'NT$1,000,000');
    });

    it('should handle negative numbers', () => {
        assert.strictEqual(formatCurrency(-1000), '-NT$1,000');
    });
});
