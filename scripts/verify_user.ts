
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'henry.lin@lig.com.tw';
    console.log(`Checking database connection and user ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log(`✅ User found: ${user.email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Name: ${user.name}`);
        } else {
            console.log(`❌ User ${email} NOT found.`);
        }
    } catch (error) {
        console.error('❌ Database connection or query failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
