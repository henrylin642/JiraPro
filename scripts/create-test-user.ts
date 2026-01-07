
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = `test.user.${Date.now()}@example.com`;
        const user = await prisma.user.create({
            data: {
                name: "Test Persistence User",
                email: email,
                role: "EMPLOYEE"
            }
        });
        console.log('Successfully created test user:', user.id, user.email);

        // Verify immediate read
        const check = await prisma.user.findUnique({ where: { id: user.id } });
        if (check) {
            console.log('Verification successful: User found in DB.');
        } else {
            console.error('Verification failed: User NOT found immediately after creation.');
        }
    } catch (e) {
        console.error('Failed to create test user:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
