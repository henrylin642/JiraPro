import { test, describe, beforeEach, mock, before } from 'node:test';
import assert from 'node:assert';

// Mock setup
// We need a mutable object for prisma.opportunity so we can change findMany
const mockOpportunity = {
    findMany: mock.fn(async () => [])
};

const mockPrisma = {
    opportunity: mockOpportunity
};

// Set global prisma mock BEFORE importing the module
// Note: This only works if we use dynamic import for the module under test,
// because static imports are hoisted and would run before this line.
(global as any).prisma = mockPrisma;

describe('getSalesForecast', () => {
    let getSalesForecast: () => Promise<any[]>;

    before(async () => {
        // Dynamically import the module to ensure global.prisma is set first
        const module = await import('./actions');
        getSalesForecast = module.getSalesForecast;
    });

    beforeEach(() => {
        // Reset call history
        mockOpportunity.findMany = mock.fn(async () => []);
    });

    test('should return empty array when no opportunities exist', async () => {
        mockOpportunity.findMany = mock.fn(async () => []);
        const result = await getSalesForecast();
        assert.deepStrictEqual(result, []);
    });

    test('should aggregate opportunities by month', async () => {
        const opportunities = [
            { expectedCloseDate: new Date('2023-10-15'), estimatedValue: 1000, probability: 50 },
            { expectedCloseDate: new Date('2023-10-20'), estimatedValue: 2000, probability: 80 },
            { expectedCloseDate: new Date('2023-11-05'), estimatedValue: 5000, probability: 20 },
        ];
        mockOpportunity.findMany = mock.fn(async () => opportunities);

        const result = await getSalesForecast();

        // expected for Oct: 1000 * 0.5 + 2000 * 0.8 = 500 + 1600 = 2100
        // expected for Nov: 5000 * 0.2 = 1000

        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].month, '2023-10');
        assert.strictEqual(result[0].value, 2100);
        assert.strictEqual(result[1].month, '2023-11');
        assert.strictEqual(result[1].value, 1000);
    });

    test('should sort months chronologically', async () => {
        const opportunities = [
            { expectedCloseDate: new Date('2023-12-01'), estimatedValue: 1000, probability: 100 },
            { expectedCloseDate: new Date('2023-01-01'), estimatedValue: 1000, probability: 100 },
        ];
        mockOpportunity.findMany = mock.fn(async () => opportunities);

        const result = await getSalesForecast();

        assert.strictEqual(result[0].month, '2023-01');
        assert.strictEqual(result[1].month, '2023-12');
    });

    test('should handle Decimal values correctly (as numbers or strings)', async () => {
        const opportunities = [
            { expectedCloseDate: new Date('2023-10-15'), estimatedValue: "1000", probability: 50 },
        ];
        mockOpportunity.findMany = mock.fn(async () => opportunities);

        const result = await getSalesForecast();
        assert.strictEqual(result[0].month, '2023-10');
        assert.strictEqual(result[0].value, 500);
    });

    test('should verify database query parameters', async () => {
        const findMany = mock.fn(async () => []);
        mockOpportunity.findMany = findMany;

        await getSalesForecast();

        const calls = findMany.mock.calls;
        assert.strictEqual(calls.length, 1);
        const args = calls[0].arguments[0];

        assert.deepStrictEqual(args.where, {
            stage: { notIn: ['CLOSED_LOST'] },
            expectedCloseDate: { not: null }
        });

        assert.deepStrictEqual(args.select, {
            expectedCloseDate: true,
            estimatedValue: true,
            probability: true
        });
    });

    test('should handle database error gracefully', async () => {
        mockOpportunity.findMany = mock.fn(async () => {
            throw new Error('DB Error');
        });

        // Mock console.error to prevent noise
        const originalConsoleError = console.error;
        let consoleErrorCalled = false;
        console.error = () => { consoleErrorCalled = true; };

        try {
            const result = await getSalesForecast();
            assert.deepStrictEqual(result, []);
            assert.strictEqual(consoleErrorCalled, true);
        } finally {
            console.error = originalConsoleError;
        }
    });
});
