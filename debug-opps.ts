
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const accountName = 'Acme Corp';
    console.log(`Searching for account: ${accountName}`);

    const account = await prisma.account.findFirst({
        where: { name: accountName },
        include: {
            opportunities: true
        }
    });

    if (!account) {
        console.log('Account not found');
        return;
    }

    console.log(`Found account: ${account.name} (${account.id})`);
    console.log('Opportunities:');
    account.opportunities.forEach(op => {
        console.log(`- Title: ${op.title}, Stage: ${op.stage}, ID: ${op.id}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
