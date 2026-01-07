'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getIdeas() {
    try {
        const ideas = await prisma.idea.findMany({
            include: {
                creator: true,
                feature: true,
            },
            orderBy: {
                votes: 'desc',
            },
        });
        return ideas;
    } catch (error) {
        console.error("Error fetching ideas:", error);
        return [];
    }
}

export async function createIdea(data: { title: string; description: string; creatorId: string }) {
    try {
        await prisma.idea.create({
            data: {
                title: data.title,
                description: data.description,
                creatorId: data.creatorId,
            },
        });
        revalidatePath('/admin/product/demand');
    } catch (error) {
        console.error("Error creating idea:", error);
        throw error;
    }
}

export async function voteIdea(id: string) {
    try {
        await prisma.idea.update({
            where: { id },
            data: {
                votes: {
                    increment: 1,
                },
            },
        });
        revalidatePath('/admin/product/demand');
    } catch (error) {
        console.error("Error voting idea:", error);
    }
}

export async function promoteToFeature(ideaId: string, productId: string) {
    try {
        const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
        if (!idea) throw new Error("Idea not found");

        const feature = await prisma.feature.create({
            data: {
                productId,
                title: idea.title,
                description: idea.description,
                status: 'BACKLOG',
                ideas: {
                    connect: { id: ideaId },
                },
            },
        });

        revalidatePath('/admin/product/demand');
        revalidatePath('/admin/product');
        return feature;
    } catch (error) {
        console.error("Error promoting idea:", error);
        throw error;
    }
}

export async function getUsers() {
    return await prisma.user.findMany();
}

export async function getProductsList() {
    return await prisma.product.findMany({
        select: { id: true, name: true }
    });
}
