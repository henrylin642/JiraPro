import { test, describe } from 'node:test';
import assert from 'node:assert';
import { serializeDecimal } from './serialize';

describe('serializeDecimal', () => {
  test('should return null for null input', () => {
    assert.strictEqual(serializeDecimal(null), null);
  });

  test('should return undefined for undefined input', () => {
    assert.strictEqual(serializeDecimal(undefined), undefined);
  });

  test('should return primitive types as is', () => {
    assert.strictEqual(serializeDecimal(123), 123);
    assert.strictEqual(serializeDecimal('hello'), 'hello');
    assert.strictEqual(serializeDecimal(true), true);
    assert.strictEqual(serializeDecimal(false), false);
  });

  test('should serialize Decimal-like objects', () => {
    const decimalLike = {
      s: 1,
      e: 2,
      d: [123],
      toNumber: () => 1.23,
    };
    assert.strictEqual(serializeDecimal(decimalLike), 1.23);

    // Without toNumber method (fallback to Number(obj))
    const decimalLikeNoMethod = {
      s: 1,
      e: 2,
      d: [123],
      valueOf: () => 4.56,
    };
    assert.strictEqual(serializeDecimal(decimalLikeNoMethod), 4.56);
  });

  test('should serialize Date objects to ISO string', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    assert.strictEqual(serializeDecimal(date), '2023-01-01T00:00:00.000Z');
  });

  test('should recursively serialize arrays', () => {
    const input = [
      1,
      { s: 1, e: 2, d: [123], toNumber: () => 1.23 },
      new Date('2023-01-01T00:00:00.000Z'),
      [null, 'nested'],
    ];
    const expected = [
      1,
      1.23,
      '2023-01-01T00:00:00.000Z',
      [null, 'nested'],
    ];
    assert.deepStrictEqual(serializeDecimal(input), expected);
  });

  test('should recursively serialize objects', () => {
    const input = {
      a: 1,
      b: { s: 1, e: 2, d: [123], toNumber: () => 1.23 },
      c: new Date('2023-01-01T00:00:00.000Z'),
      d: { nested: 'value', arr: [1, 2] },
    };
    const expected = {
      a: 1,
      b: 1.23,
      c: '2023-01-01T00:00:00.000Z',
      d: { nested: 'value', arr: [1, 2] },
    };
    assert.deepStrictEqual(serializeDecimal(input), expected);
  });

  test('should handle nested structures with mixed types', () => {
    const input = {
      users: [
        { id: 1, balance: { s: 1, e: 2, d: [100], toNumber: () => 100.50 } },
        { id: 2, balance: { s: 1, e: 2, d: [200], toNumber: () => 200.75 } },
      ],
      meta: {
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        page: 1,
      },
    };
    const expected = {
      users: [
        { id: 1, balance: 100.50 },
        { id: 2, balance: 200.75 },
      ],
      meta: {
        timestamp: '2023-01-01T12:00:00.000Z',
        page: 1,
      },
    };
    assert.deepStrictEqual(serializeDecimal(input), expected);
  });

  test('should return unexpected objects as copies (if not Decimal or Date or Array)', () => {
     // Regular object that is not Decimal or Date
     const input = { key: 'value' };
     const result = serializeDecimal(input);
     assert.deepStrictEqual(result, input);
     // It creates a new object reference because of the loop copy logic
     assert.notStrictEqual(result, input);
  });
});
