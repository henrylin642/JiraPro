'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

const AUTH_COOKIE = 'jira_pro_auth_user';

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.password !== password) { // In production, use bcrypt.compare
            return { error: 'Invalid credentials' };
        }

        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE, user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { error: `Login failed: ${(error as Error).message}` };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);
    redirect('/login');
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get(AUTH_COOKIE)?.value;

    if (!userId) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                resourceProfile: true,
            }
        });
        return user;
    } catch (error) {
        return null;
    }
}
