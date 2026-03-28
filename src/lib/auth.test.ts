
import { test, describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert';

describe('Auth Logic', () => {
    let login: any;
    let prismaMock: any;
    let cookiesMock: any;
    let bcryptMock: any;

    before(async () => {
        // Mock Prisma
        prismaMock = {
            user: {
                findUnique: mock.fn(),
                update: mock.fn(),
            },
        };

        // Mock Next.js cookies
        const cookieStore = {
            set: mock.fn(),
            delete: mock.fn(),
            get: mock.fn(),
        };
        cookiesMock = mock.fn(async () => cookieStore);

        // Mock bcrypt
        bcryptMock = {
            compare: mock.fn(),
            hash: mock.fn(),
        };

        // Mock next/navigation
        const redirectMock = mock.fn();

        // Register mocks
        mock.module('@/lib/prisma', { defaultExport: prismaMock });
        mock.module('next/headers', { namedExports: { cookies: cookiesMock } });
        mock.module('next/navigation', { namedExports: { redirect: redirectMock } });
        mock.module('bcrypt', { defaultExport: bcryptMock });

        // Import the module under test
        const authModule = await import('./auth.ts');
        login = authModule.login;
    });

    after(() => {
        mock.reset();
    });

    it('should login successfully with hashed password', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'password123');

        // Setup mocks
        prismaMock.user.findUnique.mock.mockImplementation(async () => ({
            id: 'user-1',
            email: 'test@example.com',
            password: '$2b$10$hashedpassword',
        }));

        bcryptMock.compare.mock.mockImplementation(async () => true);

        const result = await login(formData);

        assert.strictEqual(result.success, true);
        assert.strictEqual(prismaMock.user.findUnique.mock.callCount(), 1);
        assert.strictEqual(bcryptMock.compare.mock.callCount(), 1);
    });

    it('should login successfully with legacy plaintext password and migrate it', async () => {
        const formData = new FormData();
        formData.append('email', 'legacy@example.com');
        formData.append('password', 'password123');

        // Setup mocks
        prismaMock.user.findUnique.mock.mockImplementation(async () => ({
            id: 'user-2',
            email: 'legacy@example.com',
            password: 'password123', // Plaintext
        }));

        // bcrypt.compare should not be called or return false (if logic checks startsWith $2)
        // But my logic checks startsWith('$2'). 'password123' does not start with $2.
        // So bcrypt.compare is skipped.

        bcryptMock.hash.mock.mockImplementation(async () => '$2b$10$newhashedpassword');

        const result = await login(formData);

        assert.strictEqual(result.success, true);

        // Verify migration happened
        assert.strictEqual(bcryptMock.hash.mock.callCount(), 1);
        assert.strictEqual(prismaMock.user.update.mock.callCount(), 1);
        assert.deepStrictEqual(prismaMock.user.update.mock.calls[0].arguments[0], {
            where: { id: 'user-2' },
            data: { password: '$2b$10$newhashedpassword' },
        });
    });

    it('should fail with invalid credentials', async () => {
        const formData = new FormData();
        formData.append('email', 'wrong@example.com');
        formData.append('password', 'wrongpass');

        // Setup mocks
        prismaMock.user.findUnique.mock.mockImplementation(async () => ({
            id: 'user-3',
            email: 'wrong@example.com',
            password: '$2b$10$hashedpassword',
        }));

        bcryptMock.compare.mock.mockImplementation(async () => false);

        const result = await login(formData);

        assert.strictEqual(result.error, 'Invalid credentials');
    });
});
