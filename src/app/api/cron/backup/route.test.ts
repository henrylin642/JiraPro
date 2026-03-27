import { test, describe, it, beforeEach, afterEach, before, mock } from 'node:test';
import assert from 'node:assert';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
const mockGetBackupSettings = mock.fn();
const mockBackupSystem = mock.fn();
const mockFindFirst = mock.fn();

// Mock modules before importing the route
mock.module('@/app/admin/settings/actions', {
  namedExports: {
    getBackupSettings: mockGetBackupSettings,
    backupSystem: mockBackupSystem
  }
});

mock.module('@/lib/prisma', {
  namedExports: {
    prisma: {
      systemBackup: {
        findFirst: mockFindFirst
      }
    }
  }
});

describe('Backup Cron Job', () => {
    let GET: any;

    before(async () => {
        // Import the module under test dynamically
        const mod = await import('./route');
        GET = mod.GET;
    });

    beforeEach(() => {
        mockGetBackupSettings.mock.resetCalls();
        mockBackupSystem.mock.resetCalls();
        mockFindFirst.mock.resetCalls();
        // Reset timers
        mock.timers.reset();
    });

    afterEach(() => {
        mock.timers.reset();
    });

    it('should skip if backup settings are disabled', async () => {
        mockGetBackupSettings.mock.mockImplementation(async () => ({ enabled: false, hour: 19 }));

        const req = new NextRequest('http://localhost/api/cron/backup');
        const res = await GET(req);
        const data = await res.json();

        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.skipped, true);
        assert.match(data.reason, /disabled/);
        assert.strictEqual(mockBackupSystem.mock.callCount(), 0);
    });

    it('should skip if current hour is too early', async () => {
        // Set time to 18:00
        const date = new Date('2024-01-01T18:00:00Z');
        mock.timers.enable({ now: date });

        mockGetBackupSettings.mock.mockImplementation(async () => ({ enabled: true, hour: 19 }));

        const req = new NextRequest('http://localhost/api/cron/backup');
        const res = await GET(req);
        const data = await res.json();

        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.skipped, true);
        assert.match(data.reason, /Too early/);
        assert.strictEqual(mockBackupSystem.mock.callCount(), 0);
    });

    it('should skip if backup already exists for today', async () => {
        // Set time to 19:00
        const date = new Date('2024-01-01T19:00:00Z');
        mock.timers.enable({ now: date });

        mockGetBackupSettings.mock.mockImplementation(async () => ({ enabled: true, hour: 19 }));
        mockFindFirst.mock.mockImplementation(async () => ({ id: '123', createdAt: new Date() }));

        const req = new NextRequest('http://localhost/api/cron/backup');
        const res = await GET(req);
        const data = await res.json();

        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.skipped, true);
        assert.match(data.reason, /already created/);
        assert.strictEqual(mockBackupSystem.mock.callCount(), 0);
    });

    it('should execute backup if conditions are met', async () => {
        // Set time to 19:00
        const date = new Date('2024-01-01T19:00:00Z');
        mock.timers.enable({ now: date });

        mockGetBackupSettings.mock.mockImplementation(async () => ({ enabled: true, hour: 19 }));
        mockFindFirst.mock.mockImplementation(async () => null); // No existing backup
        mockBackupSystem.mock.mockImplementation(async () => ({ success: true }));

        const req = new NextRequest('http://localhost/api/cron/backup');
        const res = await GET(req);
        const data = await res.json();

        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.success, true);
        assert.match(data.message, /successfully/);
        assert.strictEqual(mockBackupSystem.mock.callCount(), 1);
    });

    it('should return error if backup fails', async () => {
        // Set time to 19:00
        const date = new Date('2024-01-01T19:00:00Z');
        mock.timers.enable({ now: date });

        mockGetBackupSettings.mock.mockImplementation(async () => ({ enabled: true, hour: 19 }));
        mockFindFirst.mock.mockImplementation(async () => null);
        mockBackupSystem.mock.mockImplementation(async () => ({ success: false, error: 'Disk full' }));

        const req = new NextRequest('http://localhost/api/cron/backup');
        const res = await GET(req);
        const data = await res.json();

        assert.strictEqual(res.status, 500);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error, 'Disk full');
        assert.strictEqual(mockBackupSystem.mock.callCount(), 1);
    });
});
