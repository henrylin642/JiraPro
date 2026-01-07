
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'henry.lin@lig.com.tw';
    const password = 'not_secure_password'; // Updated below to match user request
    const name = 'Henry Lin';

    console.log(`Checking if user ${email} exists...`);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`User ${email} already exists.`);
        return;
    }

    console.log(`Creating admin user ${email}...`);

    const user = await prisma.user.create({
        data: {
            email,
            password: '123456', // User specified password
            name,
            role: 'ADMIN',
            resourceProfile: {
                create: {
                    title: 'System Administrator',
                    skills: 'Full Stack, DevOps',
                    costRate: 0,
                    billableRate: 0,
                },
            },
        },
    });

    console.log(`✅ Admin user created successfully: ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
