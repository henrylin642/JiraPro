import { test } from 'node:test';
import assert from 'node:assert';
import { cn } from './utils';

test('cn utility', async (t) => {
  await t.test('merges class names', () => {
    assert.strictEqual(cn('foo', 'bar'), 'foo bar');
  });

  await t.test('handles conditional classes', () => {
    assert.strictEqual(cn('foo', true && 'bar', false && 'baz'), 'foo bar');
  });

  await t.test('resolves Tailwind conflicts', () => {
    // p-4 is overridden by p-2 because p-2 comes later
    assert.strictEqual(cn('p-4', 'p-2'), 'p-2');
    // text-red-500 is overridden by text-blue-500
    assert.strictEqual(cn('text-red-500', 'text-blue-500'), 'text-blue-500');
  });

  await t.test('handles mixed inputs', () => {
    assert.strictEqual(
      cn('text-red-500', ['bg-blue-500', { 'p-4': true }]),
      'text-red-500 bg-blue-500 p-4'
    );
  });

  await t.test('handles empty inputs', () => {
    assert.strictEqual(cn(), '');
    assert.strictEqual(cn(null, undefined, false), '');
  });

  await t.test('handles more complex conflict resolution', () => {
      // block vs inline
      assert.strictEqual(cn('block', 'inline'), 'inline');

      // padding override
      // px-4 sets padding-left and padding-right to 1rem
      // pl-2 sets padding-left to 0.5rem
      // Result should be px-4 pl-2 because they are distinct properties in CSS (though one overrides part of another)
      // Actually tailwind-merge might keep both if they don't strictly conflict in a way that requires removal.
      // But let's test something that definitely conflicts.
      assert.strictEqual(cn('px-4', 'px-2'), 'px-2');
  });
});
