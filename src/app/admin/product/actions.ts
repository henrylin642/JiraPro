'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            include: {
                roadmap: {
                    orderBy: { startDate: 'asc' },
                },
                features: {
                    include: {
                        ideas: true,
                        opportunities: true,
                    },
                },
            },
        });

        return products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            roadmap: product.roadmap.map(item => ({
                ...item,
                startDate: item.startDate.toISOString(),
                endDate: item.endDate.toISOString(),
            })),
            features: product.features.map(feature => ({
                id: feature.id,
                title: feature.title,
                description: feature.description,
                status: feature.status,
                riceReach: feature.riceReach,
                riceImpact: Number(feature.riceImpact),
                riceConfidence: feature.riceConfidence,
                riceEffort: Number(feature.riceEffort),
                riceScore: Number(feature.riceScore),
                opportunities: feature.opportunities.map(opp => ({
                    estimatedValue: Number(opp.estimatedValue),
                    probability: opp.probability,
                })),
            })),
        }));
    } catch (error) {
        console.error("Error in getProducts:", error);
        return [];
    }
}

export async function createRoadmapItem(data: {
    productId: string;
    title: string;
    version: string;
    startDate: Date;
    endDate: Date;
}) {
    await prisma.roadmapItem.create({
        data: {
            productId: data.productId,
            title: data.title,
            version: data.version,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    });
    revalidatePath('/admin/product');
}

export async function createFeature(data: {
    productId: string;
    title: string;
    description?: string;
    status: string;
}) {
    await prisma.feature.create({
        data: {
            productId: data.productId,
            title: data.title,
            description: data.description,
            status: data.status,
        },
    });
    revalidatePath('/admin/product');
}

export async function updateFeatureRice(featureId: string, data: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
}) {
    try {
        // Calculate RICE Score
        // Score = (Reach * Impact * Confidence%) / Effort
        // Avoid division by zero
        const effort = data.effort === 0 ? 1 : data.effort;
        const score = (data.reach * data.impact * (data.confidence / 100)) / effort;

        await prisma.feature.update({
            where: { id: featureId },
            data: {
                riceReach: data.reach,
                riceImpact: data.impact,
                riceConfidence: data.confidence,
                riceEffort: data.effort,
                riceScore: score,
            },
        });

        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error updating RICE score:", error);
        throw error;
    }
}


export async function createProduct(data: { name: string; description?: string }) {
    try {
        await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
            },
        });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
}

export async function updateProduct(id: string, data: { name: string; description?: string }) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
            },
        });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
}

export async function deleteProduct(id: string) {
    try {
        // Delete related data first (Cascade logic usually handled by DB, but safe to be explicit if needed, 
        // though Prisma schema might not have cascade delete set up everywhere)

        // Delete features (and their related ideas/opportunities links if any)
        const features = await prisma.feature.findMany({ where: { productId: id } });
        for (const f of features) {
            await deleteFeature(f.id);
        }

        // Delete roadmap items
        await prisma.roadmapItem.deleteMany({ where: { productId: id } });

        await prisma.product.delete({ where: { id } });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
}

export async function updateFeature(id: string, data: { title: string; description?: string; status: string }) {
    try {
        await prisma.feature.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
            },
        });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error updating feature:", error);
        throw error;
    }
}

export async function deleteFeature(id: string) {
    try {
        // Unlink ideas first
        await prisma.idea.updateMany({
            where: { featureId: id },
            data: { featureId: null }
        });

        // Remove opportunities links (implicit via relation table if many-to-many, usually handled automatically by Prisma for implicit m-n)

        await prisma.feature.delete({ where: { id } });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error deleting feature:", error);
        throw error;
    }
}

export async function updateRoadmapItem(id: string, data: { title: string; version?: string; startDate: Date; endDate: Date }) {
    try {
        await prisma.roadmapItem.update({
            where: { id },
            data: {
                title: data.title,
                version: data.version,
                startDate: data.startDate,
                endDate: data.endDate
            },
        });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error updating roadmap item:", error);
        throw error;
    }
}

export async function deleteRoadmapItem(id: string) {
    try {
        await prisma.roadmapItem.delete({ where: { id } });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error deleting roadmap item:", error);
        throw error;
    }
}

// --- Demand & Ideas ---


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

        return ideas.map(idea => ({
            ...idea,
            feature: idea.feature ? {
                ...idea.feature,
                riceImpact: Number(idea.feature.riceImpact),
                riceEffort: Number(idea.feature.riceEffort),
                riceScore: Number(idea.feature.riceScore),
            } : null
        }));
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
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error creating idea:", error);
        throw error;
    }
}

export async function updateIdea(id: string, data: { title: string; description: string; creatorId: string }) {
    try {
        await prisma.idea.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                creatorId: data.creatorId,
            },
        });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error updating idea:", error);
        throw error;
    }
}

export async function deleteIdea(id: string) {
    try {
        await prisma.idea.delete({ where: { id } });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error deleting idea:", error);
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
        revalidatePath('/admin/product');
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

// --- Business Model Canvas ---

export async function getBusinessModel(productId: string) {
    try {
        const bmc = await prisma.businessModelCanvas.findUnique({
            where: { productId }
        });
        return bmc;
    } catch (error) {
        console.error("Error fetching BMC:", error);
        return null;
    }
}

export async function updateBusinessModel(productId: string, data: any) {
    try {
        await prisma.businessModelCanvas.upsert({
            where: { productId },
            update: {
                keyPartners: data.keyPartners,
                keyActivities: data.keyActivities,
                keyResources: data.keyResources,
                valuePropositions: data.valuePropositions,
                customerRelationships: data.customerRelationships,
                channels: data.channels,
                customerSegments: data.customerSegments,
                costStructure: data.costStructure,
                revenueStreams: data.revenueStreams,
            },
            create: {
                productId,
                keyPartners: data.keyPartners,
                keyActivities: data.keyActivities,
                keyResources: data.keyResources,
                valuePropositions: data.valuePropositions,
                customerRelationships: data.customerRelationships,
                channels: data.channels,
                customerSegments: data.customerSegments,
                costStructure: data.costStructure,
                revenueStreams: data.revenueStreams,
            },
        });
        revalidatePath('/admin/product');
    } catch (error) {
        console.error("Error updating BMC:", error);
        throw error;
    }
}
