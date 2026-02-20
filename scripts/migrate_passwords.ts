import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting password migration...');

    const users = await prisma.user.findMany();
    let updatedCount = 0;

    for (const user of users) {
        // Check if password looks like a bcrypt hash
        if (user.password.startsWith('$2')) {
            console.log(`ℹ️ User ${user.email} already has a hashed password. Skipping.`);
            continue;
        }

        console.log(`🔐 Hashing password for user ${user.email}...`);
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        updatedCount++;
    }

    console.log(`✅ Migration complete. Updated ${updatedCount} users.`);
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
