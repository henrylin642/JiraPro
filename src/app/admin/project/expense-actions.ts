'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export async function importExpenses(projectId: string, formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("No file provided");

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(sheet) as any[];

        const expensesToCreate = [];

        for (const row of rawData) {
            // Mapping Logic (Based on image and requirements)
            // Amount: 金額, Amount, Cost, 申請費用, 請款金額
            // Description: 說明, Description, Item, 摘要, 申請理由
            // Date: 申請日, Date, 日期
            // Applicant: 申請人, Applicant, Name
            // Category: 會計科目, 科目, Category, Subject, Account, 科目代碼

            let amount = row['金額'] || row['Amount'] || row['Cost'] || row['amount'] || row['申請費用'] || row['請款金額'] || 0;
            let description = row['說明'] || row['摘要'] || row['Description'] || row['Item'] || row['申請理由'] || 'Imported Expense';
            let dateVal = row['申請日'] || row['Date'] || row['日期'] || new Date();
            let applicant = row['申請人'] || row['Applicant'] || row['Name'] || row['Incurred By'];
            let categoryRaw = row['會計科目'] || row['科目'] || row['Category'] || row['Subject'] || row['Account'] || row['科目代碼'] || row['Account Code'] || row['Subject Code'];

            // Clean Amount
            if (typeof amount === 'string') {
                amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
            }
            if (isNaN(amount) || amount === 0) continue; // Skip invalid rows

            // Clean Date
            let date = new Date();
            if (typeof dateVal === 'number') {
                // Excel serial date
                date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            } else {
                date = new Date(dateVal);
            }
            if (isNaN(date.getTime())) date = new Date();

            let category = 'General';
            if (categoryRaw) {
                const categoryText = String(categoryRaw).trim();
                if (categoryText) {
                    const match = await prisma.expenseCategory.findFirst({
                        where: {
                            OR: [
                                { code: categoryText },
                                { name: categoryText }
                            ]
                        }
                    });
                    category = match?.name || categoryText;
                }
            }

            expensesToCreate.push({
                projectId,
                description: String(description),
                amount: Number(amount),
                date: date,
                incurredBy: applicant ? String(applicant) : null,
                category
            });
        }

        if (expensesToCreate.length === 0) {
            return { success: false, error: "No valid expense rows found" };
        }

        await prisma.expense.createMany({
            data: expensesToCreate
        });

        revalidatePath(`/admin/project/${projectId}`);
        return { success: true, count: expensesToCreate.length };
    } catch (error) {
        console.error("Error importing expenses:", error);
        return { success: false, error: "Failed to import expenses" };
    }
}

export async function getExpenses(projectId: string) {
    try {
        const expenses = await prisma.expense.findMany({
            where: { projectId },
            orderBy: { date: 'desc' },
        });
        return expenses;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return [];
    }
}

export async function updateExpense(id: string, data: {
    description: string;
    amount: number;
    date: Date;
    category?: string;
    incurredBy?: string;
}) {
    try {
        const expense = await prisma.expense.update({
            where: { id },
            data: {
                description: data.description,
                amount: data.amount,
                date: data.date,
                category: data.category,
                incurredBy: data.incurredBy
            }
        });
        revalidatePath(`/admin/project/${expense.projectId}`); // Revalidate project page (expense might not have projectId in return if we don't select it, but update returns the object so it's fine)
        return { success: true, expense };
    } catch (error) {
        console.error("Error updating expense:", error);
        return { success: false, error: "Failed to update expense" };
    }
}

export async function deleteExpense(id: string) {
    try {
        const expense = await prisma.expense.delete({
            where: { id }
        });
        revalidatePath(`/admin/project/${expense.projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { success: false, error: "Failed to delete expense" };
    }
}
