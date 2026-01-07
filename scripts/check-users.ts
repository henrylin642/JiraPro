
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const contactCount = await prisma.contact.count();
    const accountCount = await prisma.account.count();

    console.log(`Users (Resources): ${userCount}`);
    console.log(`Contacts (CRM): ${contactCount}`);
    console.log(`Accounts (CRM): ${accountCount}`);

    const users = await prisma.user.findMany({ select: { name: true, role: true } });
    console.log('Users (Internal):', JSON.stringify(users, null, 2));

    const contacts = await prisma.contact.findMany({ include: { account: { select: { name: true } } } });
    console.log('Contacts (External):', JSON.stringify(contacts.map(c => ({ name: c.name, company: c.account.name })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
