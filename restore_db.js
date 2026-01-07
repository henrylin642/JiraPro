
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, 'backup_data');

async function restore() {
    console.log('📦 Starting database restore...');

    // Helper to read JSON
    const readBackup = (model) => {
        try {
            const raw = fs.readFileSync(path.join(BACKUP_DIR, `${model}.json`));
            return JSON.parse(raw);
        } catch (e) {
            console.error(`⚠️ Could not read backup for ${model}`);
            return [];
        }
    };

    // 1. Users & Profiles
    const users = readBackup('user');
    for (const u of users) {
        await prisma.user.create({ data: u });
    }
    console.log(`✅ Restored ${users.length} Users`);

    const profiles = readBackup('resourceProfile');
    for (const p of profiles) {
        // Decimal handling: Prisma expects strings or Decimal objects for create
        await prisma.resourceProfile.create({
            data: { ...p, costRate: p.costRate, billableRate: p.billableRate }
        });
    }
    console.log(`✅ Restored ${profiles.length} ResourceProfiles`);

    // 2. Products & Roadmap & BMC
    const products = readBackup('product');
    for (const p of products) {
        await prisma.product.create({ data: p });
    }
    console.log(`✅ Restored ${products.length} Products`);

    const bmc = readBackup('businessModelCanvas');
    for (const b of bmc) {
        await prisma.businessModelCanvas.create({ data: b });
    }
    console.log(`✅ Restored ${bmc.length} BMCs`);

    const roadmapItems = readBackup('roadmapItem');
    for (const r of roadmapItems) {
        await prisma.roadmapItem.create({ data: r });
    }
    console.log(`✅ Restored ${roadmapItems.length} RoadmapItems`);

    // 3. Accounts & Contacts
    const accounts = readBackup('account');
    for (const a of accounts) {
        await prisma.account.create({ data: a });
    }
    console.log(`✅ Restored ${accounts.length} Accounts`);

    const contacts = readBackup('contact');
    for (const c of contacts) {
        await prisma.contact.create({ data: c });
    }
    console.log(`✅ Restored ${contacts.length} Contacts`);

    // 4. Opportunities (needs Account)
    const opportunities = readBackup('opportunity');
    for (const o of opportunities) {
        await prisma.opportunity.create({
            data: { ...o, estimatedValue: o.estimatedValue }
        });
    }
    console.log(`✅ Restored ${opportunities.length} Opportunities`);

    // 5. Interactions (needs Account, User, Opportunity)
    const interactions = readBackup('interaction');
    for (const i of interactions) {
        await prisma.interaction.create({ data: i });
    }
    console.log(`✅ Restored ${interactions.length} Interactions`);

    // 6. Features (needs Product, Opportunity)
    const features = readBackup('feature');
    for (const f of features) {
        const { opportunities, ...featureData } = f;
        await prisma.feature.create({
            data: {
                ...featureData,
                riceImpact: featureData.riceImpact,
                riceEffort: featureData.riceEffort,
                riceScore: featureData.riceScore,
                opportunities: {
                    connect: opportunities ? opportunities.map(o => ({ id: o.id })) : []
                }
            }
        });
    }
    console.log(`✅ Restored ${features.length} Features`);

    // 7. Projects (needs Account, Manager)
    const projects = readBackup('project');
    for (const p of projects) {
        await prisma.project.create({
            data: { ...p, budget: p.budget }
        });
    }
    console.log(`✅ Restored ${projects.length} Projects`);

    // 8. Milestones (needs Project)
    const milestones = readBackup('milestone');
    for (const m of milestones) {
        await prisma.milestone.create({
            data: { ...m, amount: m.amount }
        });
    }
    console.log(`✅ Restored ${milestones.length} Milestones`);

    // 9. Tasks (needs Project, Milestone, Assignee)
    const tasks = readBackup('task');
    for (const t of tasks) {
        await prisma.task.create({ data: t }); // Tasks might have self-relation (subtasks), tricky if order matters. 
        // Ideally should do 2 passes or simpler: create all then connect parents.
        // For now assuming order in ID/backup is chronological enough or simple structure.
    }
    console.log(`✅ Restored ${tasks.length} Tasks`);

    // 10. Allocations
    const allocations = readBackup('allocation');
    for (const a of allocations) {
        await prisma.allocation.create({ data: a });
    }
    console.log(`✅ Restored ${allocations.length} Allocations`);

    // 11. Timesheets (needs User, Task)
    const timesheets = readBackup('timesheetEntry');
    for (const t of timesheets) {
        await prisma.timesheetEntry.create({
            data: { ...t, hours: t.hours, costRate: t.costRate, billableRate: t.billableRate }
        });
    }
    console.log(`✅ Restored ${timesheets.length} TimesheetEntries`);

    // 12. Expense Categories
    const expenseCategories = readBackup('expenseCategory');
    for (const ec of expenseCategories) {
        await prisma.expenseCategory.create({ data: ec });
    }
    console.log(`✅ Restored ${expenseCategories.length} ExpenseCategories`);

    // 13. Expenses (needs Project)
    const expenses = readBackup('expense');
    for (const e of expenses) {
        await prisma.expense.create({
            data: { ...e, amount: e.amount }
        });
    }
    console.log(`✅ Restored ${expenses.length} Expenses`);

    // 14. Ideas (needs Creator, Feature)
    const ideas = readBackup('idea');
    for (const i of ideas) {
        await prisma.idea.create({ data: i });
    }
    console.log(`✅ Restored ${ideas.length} Ideas`);


    console.log('\n🎉 Restore completed!');
}

restore()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
