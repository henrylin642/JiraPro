'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


export async function getAccounts() {
    try {
        const accounts = await prisma.account.findMany({
            include: {
                _count: {
                    select: {
                        opportunities: {
                            where: {
                                stage: {
                                    notIn: ['CLOSED_WON', 'CLOSED_LOST']
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return accounts;
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return [];
    }
}

export async function getAccountDetails(id: string) {
    try {

        const account = await prisma.account.findUnique({
            where: { id },
            include: {
                contacts: true,
                interactions: {
                    include: { user: true },
                    orderBy: { date: 'desc' }
                },
                projects: {
                    where: { status: 'COMPLETED' }, // Closed projects
                    select: { id: true, name: true, budget: true }
                },
                opportunities: true
            }
        });

        if (!account) return null;

        return {
            ...account,
            projects: account.projects.map(p => ({
                ...p,
                budget: Number(p.budget)
            })),
            opportunities: account.opportunities.map(o => ({
                ...o,
                estimatedValue: Number(o.estimatedValue)
            }))
        };
    } catch (error) {
        console.error("Error fetching account details:", error);
        return null;
    }
}

export type CreateAccountData = {
    name: string;
    industry?: string;
    website?: string;
    phone?: string;
    address?: string;
    taxId?: string;
}

export async function createAccount(data: CreateAccountData) {
    try {
        console.log("Creating account with data:", data);
        const account = await prisma.account.create({
            data: {
                name: data.name,
                industry: data.industry || null,
                website: data.website || null,
                phone: data.phone || null,
                address: data.address || null,
                taxId: data.taxId || null,
            }
        });
        console.log("Account created:", account);
        revalidatePath('/admin/crm');
        return { success: true, account };
    } catch (error) {
        console.error("Error creating account:", error);
        return { success: false, error: "Failed to create account" };
    }
}

export async function updateAccount(id: string, data: CreateAccountData) {
    try {
        await prisma.account.update({
            where: { id },
            data: {
                name: data.name,
                industry: data.industry,
                website: data.website,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
            }
        });
        revalidatePath('/admin/crm');
        revalidatePath(`/admin/crm/account/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating account:", error);
        return { success: false, error: "Failed to update account" };
    }
}

export async function addContact(accountId: string, data: { name: string; title?: string; email?: string; phone?: string; linkedIn?: string }) {
    try {
        await prisma.contact.create({
            data: {
                accountId,
                name: data.name,
                title: data.title,
                email: data.email,
                phone: data.phone,
                linkedIn: data.linkedIn
            }
        });
        revalidatePath(`/admin/crm/account/${accountId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding contact:", error);
        return { success: false, error: "Failed to add contact" };
    }
}

export async function logInteraction(accountId: string, userId: string, data: { type: string; notes?: string; date: Date }) {
    try {
        await prisma.interaction.create({
            data: {
                accountId,
                userId,
                type: data.type,
                notes: data.notes,
                date: data.date
            }
        });
        revalidatePath(`/admin/crm/account/${accountId}`);
        return { success: true };
    } catch (error) {
        console.error("Error logging interaction:", error);
        return { success: false, error: "Failed to log interaction" };
    }
}


export async function deleteAccount(id: string) {
    try {
        // Check for related data before deletion
        const account = await prisma.account.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        projects: true,
                        opportunities: true,
                    }
                }
            }
        });

        if (!account) {
            return { success: false, error: "Account not found" };
        }

        if (account._count.projects > 0) {
            return { success: false, error: `Cannot delete account. Valid projects still exist (${account._count.projects}).` };
        }

        if (account._count.opportunities > 0) {
            return { success: false, error: `Cannot delete account. Active opportunities still exist (${account._count.opportunities}).` };
        }

        // Delete related contacts and interactions first
        await prisma.interaction.deleteMany({ where: { accountId: id } });
        await prisma.contact.deleteMany({ where: { accountId: id } });

        await prisma.account.delete({
            where: { id }
        });

        revalidatePath('/admin/crm');
        return { success: true };
    } catch (error) {
        console.error("Error deleting account:", error);
        return { success: false, error: "Failed to delete account" };
    }
}

export async function updateContact(contactId: string, data: { name: string; title?: string; email?: string; phone?: string; linkedIn?: string }) {
    try {
        const contact = await prisma.contact.update({
            where: { id: contactId },
            data: {
                name: data.name,
                title: data.title,
                email: data.email,
                phone: data.phone,
                linkedIn: data.linkedIn
            }
        });
        revalidatePath(`/admin/crm/account/${contact.accountId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating contact:", error);
        return { success: false, error: "Failed to update contact" };
    }
}

export async function deleteContact(contactId: string, accountId: string) {
    try {
        await prisma.contact.delete({
            where: { id: contactId }
        });
        revalidatePath(`/admin/crm/account/${accountId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting contact:", error);
        return { success: false, error: "Failed to delete contact" };
    }
}
