import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mocks
const findUniqueMock = mock.fn();
const updateMock = mock.fn();
const revalidatePathMock = mock.fn();
const calculateDealHealthMock = mock.fn();

// Mock modules
mock.module('@/lib/prisma', {
  defaultExport: {
    opportunity: {
      findUnique: findUniqueMock,
      update: updateMock,
    }
  },
  namedExports: {
    prisma: {
      opportunity: {
        findUnique: findUniqueMock,
        update: updateMock,
      }
    }
  }
});

mock.module('next/cache', {
  namedExports: {
    revalidatePath: revalidatePathMock,
  }
});

mock.module('@/lib/deal-health', {
  namedExports: {
    calculateDealHealth: calculateDealHealthMock
  }
});

describe('updateOpportunity', async () => {
    // Import inside describe to ensure mocks are active
    const { updateOpportunity } = await import('./actions');

    beforeEach(() => {
        findUniqueMock.mock.resetCalls();
        updateMock.mock.resetCalls();
        revalidatePathMock.mock.resetCalls();
        calculateDealHealthMock.mock.resetCalls();

        // Default mock implementations
        calculateDealHealthMock.mock.mockImplementation(() => ({
            score: 80,
            signals: [],
            recommendedProbability: 50,
            probabilityDelta: 0
        }));
    });

    const mockOpp = {
        id: 'opp-1',
        title: 'Test Opportunity',
        stage: 'LEAD',
        probability: 50,
        estimatedValue: 10000,
        accountId: 'acc-1',
        expectedCloseDate: new Date('2023-12-31'),
        ownerId: 'owner-1',
        serviceAreaId: 'area-1',
        checklist: [],
        stageUpdatedAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        interactions: [],
        tasks: [],
        probabilityOverrideReason: null
    };

    it('should update opportunity successfully (happy path)', async () => {
        findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockOpp));
        updateMock.mock.mockImplementation(() => Promise.resolve({ ...mockOpp, title: 'Updated Title' }));

        const result = await updateOpportunity('opp-1', {
            title: 'Updated Title',
            stage: 'LEAD',
            probability: 50,
            estimatedValue: 12000,
            accountId: 'acc-1',
            expectedCloseDate: new Date('2023-12-31'),
            ownerId: 'owner-1',
            serviceAreaId: 'area-1',
        });

        assert.strictEqual(result.success, true);
        assert.strictEqual(updateMock.mock.callCount(), 1);
        assert.strictEqual(revalidatePathMock.mock.callCount(), 2);
    });

    it('should return NOT_FOUND if opportunity does not exist', async () => {
        findUniqueMock.mock.mockImplementation(() => Promise.resolve(null));

        const result = await updateOpportunity('non-existent', {
            title: 'Title',
            stage: 'LEAD',
            probability: 50,
            estimatedValue: 10000,
            accountId: 'acc-1'
        });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'NOT_FOUND');
        assert.strictEqual(updateMock.mock.callCount(), 0);
    });

    it('should return PROBABILITY_REASON_REQUIRED if gap >= 20% and no reason provided', async () => {
        findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockOpp));

        // Mock health calculation to recommend 50%
        calculateDealHealthMock.mock.mockImplementation(() => ({
            recommendedProbability: 50
        }));

        // Try to update probability to 80% (gap = 30%)
        const result = await updateOpportunity('opp-1', {
            ...mockOpp,
            probability: 80,
            probabilityOverrideReason: '' // No reason
        });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'PROBABILITY_REASON_REQUIRED');
        assert.strictEqual(updateMock.mock.callCount(), 0);
    });

    it('should allow update if gap >= 20% but reason is provided', async () => {
        findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockOpp));
        updateMock.mock.mockImplementation(() => Promise.resolve(mockOpp));

        calculateDealHealthMock.mock.mockImplementation(() => ({
            recommendedProbability: 50
        }));

        const result = await updateOpportunity('opp-1', {
            ...mockOpp,
            probability: 80,
            probabilityOverrideReason: 'Valid reason'
        });

        assert.strictEqual(result.success, true);
        assert.strictEqual(updateMock.mock.callCount(), 1);
        // Verify probabilityOverrideReason was passed to update
        const updateArg = updateMock.mock.calls[0].arguments[0];
        assert.strictEqual(updateArg.data.probabilityOverrideReason, 'Valid reason');
    });

    it('should update stageUpdatedAt when stage changes', async () => {
        findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockOpp));
        updateMock.mock.mockImplementation(() => Promise.resolve({ ...mockOpp, stage: 'QUALIFIED' }));

        await updateOpportunity('opp-1', {
            ...mockOpp,
            stage: 'QUALIFIED' // Changed from LEAD
        });

        const updateArg = updateMock.mock.calls[0].arguments[0];
        assert.ok(updateArg.data.stageUpdatedAt instanceof Date);
        // Should be close to now
        assert.ok(Date.now() - updateArg.data.stageUpdatedAt.getTime() < 1000);
    });

    it('should NOT update stageUpdatedAt when stage does not change', async () => {
        findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockOpp));
        updateMock.mock.mockImplementation(() => Promise.resolve(mockOpp));

        await updateOpportunity('opp-1', {
            ...mockOpp,
            stage: 'LEAD' // Same as current
        });

        const updateArg = updateMock.mock.calls[0].arguments[0];
        assert.strictEqual(updateArg.data.stageUpdatedAt, undefined);
    });
});
