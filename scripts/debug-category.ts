
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing ExpenseCategory connection...');
        const count = await prisma.expenseCategory.count();
        console.log('Current category count:', count);

        const testName = 'Test Cat ' + Date.now();
        const newCat = await prisma.expenseCategory.create({
            data: { name: testName }
        });
        console.log('Successfully created category:', newCat);

        await prisma.expenseCategory.delete({
            where: { id: newCat.id }
        });
        console.log('Successfully deleted test category');

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
