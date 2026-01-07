
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const accountName = 'Acme Corp';
    console.log(`Fixing opportunity for account: ${accountName}`);

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

    // Assuming we want to close all opportunities for Acme Corp that have a matching project or just force close based on user request context.
    // The user says "Amen Corp" (likely typo for Acme Corp, based on screenshot) should not have active deals.
    // The screenshot shows "Acme Corp" with 1 Active Deal.

    for (const op of account.opportunities) {
        if (op.stage !== 'CLOSED_WON' && op.stage !== 'CLOSED_LOST') {
            console.log(`Updating Opportunity: ${op.title} from ${op.stage} to CLOSED_WON`);
            await prisma.opportunity.update({
                where: { id: op.id },
                data: { stage: 'CLOSED_WON' }
            });
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
