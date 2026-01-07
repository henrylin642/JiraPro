
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Task model fields...');
    // This is a type check basically, but at runtime we can just inspect dmmf or try a query
    // We can try to create a dummy task with parentId and see if it throws validation error
    // But strictly speaking, if the client is generated, this script (running in new process) should work.

    try {
        // Just check if we can inspect the model
        // Prisma Client doesn't expose fields at runtime easily without dmmf
        // But we can try a findFirst with specific select including parentId
        const task = await prisma.task.findFirst({
            select: { id: true, parentId: true }
        });
        console.log('Successfully queried task with parentId selection.');
    } catch (e) {
        console.error('Error querying parentId:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
