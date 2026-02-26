import { test, mock, describe, beforeEach, before } from 'node:test';
import assert from 'node:assert';
import type * as AuthModule from './auth';

// Mock dependencies
const mockPrisma = {
  user: {
    findUnique: mock.fn(),
  },
};

mock.module('@/lib/prisma', {
  defaultExport: mockPrisma,
});

const mockCookies = {
  set: mock.fn(),
  get: mock.fn(),
  delete: mock.fn(),
  getAll: mock.fn(),
  has: mock.fn(),
};

// cookies() returns a Promise in Next.js 15
mock.module('next/headers', {
  namedExports: {
    cookies: async () => mockCookies,
  },
});

const mockRedirect = mock.fn();
mock.module('next/navigation', {
  namedExports: {
    redirect: mockRedirect,
  },
});

let login: typeof AuthModule.login;
let logout: typeof AuthModule.logout;
let getCurrentUser: typeof AuthModule.getCurrentUser;

describe('Auth', () => {
  before(async () => {
    // Import the module under test dynamically to ensure mocks are applied
    const mod = await import('./auth');
    login = mod.login;
    logout = mod.logout;
    getCurrentUser = mod.getCurrentUser;
  });

  beforeEach(() => {
    mockPrisma.user.findUnique.mock.resetCalls();
    mockCookies.set.mock.resetCalls();
    mockCookies.get.mock.resetCalls();
    mockCookies.delete.mock.resetCalls();
    mockRedirect.mock.resetCalls();
  });

  describe('login', () => {
    test('should return error if email or password is missing', async () => {
      const formData = new FormData();
      formData.append('email', '');
      formData.append('password', 'password');

      const result = await login(formData);
      assert.deepStrictEqual(result, { error: 'Email and password are required' });

      const formData2 = new FormData();
      formData2.append('email', 'test@example.com');
      // password missing

      const result2 = await login(formData2);
      assert.deepStrictEqual(result2, { error: 'Email and password are required' });
    });

    test('should return error if user not found', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(async () => null);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password');

      const result = await login(formData);
      assert.deepStrictEqual(result, { error: 'Invalid credentials' });
      assert.strictEqual(mockPrisma.user.findUnique.mock.callCount(), 1);
    });

    test('should return error if password does not match', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(async () => ({
        id: 'user-id',
        email: 'test@example.com',
        password: 'correct-password',
      }));

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrong-password');

      const result = await login(formData);
      assert.deepStrictEqual(result, { error: 'Invalid credentials' });
    });

    test('should set cookie and return success on valid credentials', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(async () => ({
        id: 'user-id',
        email: 'test@example.com',
        password: 'password',
      }));

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password');

      const result = await login(formData);
      assert.deepStrictEqual(result, { success: true });

      assert.strictEqual(mockCookies.set.mock.callCount(), 1);
      const callArgs = mockCookies.set.mock.calls[0].arguments;
      assert.strictEqual(callArgs[0], 'jira_pro_auth_user');
      assert.strictEqual(callArgs[1], 'user-id');
      // Assert options
      assert.strictEqual(callArgs[2].httpOnly, true);
      assert.strictEqual(callArgs[2].path, '/');
    });

    test('should handle database errors', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(async () => {
        throw new Error('Database error');
      });

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password');

      const result = await login(formData);
      assert.strictEqual(result.error, 'Login failed: Database error');
    });
  });

  describe('logout', () => {
    test('should delete cookie and redirect', async () => {
      await logout();

      assert.strictEqual(mockCookies.delete.mock.callCount(), 1);
      assert.strictEqual(mockCookies.delete.mock.calls[0].arguments[0], 'jira_pro_auth_user');

      assert.strictEqual(mockRedirect.mock.callCount(), 1);
      assert.strictEqual(mockRedirect.mock.calls[0].arguments[0], '/login');
    });
  });

  describe('getCurrentUser', () => {
    test('should return null if no cookie', async () => {
      mockCookies.get.mock.mockImplementation(() => undefined);

      const user = await getCurrentUser();
      assert.strictEqual(user, null);
    });

    test('should return user if cookie exists and user found', async () => {
      mockCookies.get.mock.mockImplementation(() => ({ value: 'user-id' }));

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      mockPrisma.user.findUnique.mock.mockImplementation(async () => mockUser);

      const user = await getCurrentUser();
      assert.deepStrictEqual(user, mockUser);

      // Verify include was passed
      const callArgs = mockPrisma.user.findUnique.mock.calls[0].arguments;
      assert.strictEqual(callArgs[0].where.id, 'user-id');
      assert.deepStrictEqual(callArgs[0].include, { resourceProfile: true });
    });

    test('should return null if user not found', async () => {
      mockCookies.get.mock.mockImplementation(() => ({ value: 'user-id' }));
      mockPrisma.user.findUnique.mock.mockImplementation(async () => null);

      const user = await getCurrentUser();
      assert.strictEqual(user, null);
    });

    test('should return null on database error', async () => {
      mockCookies.get.mock.mockImplementation(() => ({ value: 'user-id' }));
      mockPrisma.user.findUnique.mock.mockImplementation(async () => {
        throw new Error('DB Error');
      });

      const user = await getCurrentUser();
      assert.strictEqual(user, null);
    });
  });
});
