
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, 'backup_data');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

async function backup() {
    console.log('📦 Starting database backup...');

    // List of models to backup
    // Standard models
    const simpleModels = [
        'user', 'resourceProfile', 'account', 'contact', 'interaction',
        'opportunity', 'businessModelCanvas',
        'roadmapItem', 'idea', 'project', 'expense', 'expenseCategory',
        'milestone', 'task', 'allocation', 'timesheetEntry'
    ];

    for (const model of simpleModels) {
        try {
            const data = await prisma[model].findMany();
            fs.writeFileSync(
                path.join(BACKUP_DIR, `${model}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`✅ Backed up ${model} (${data.length} records)`);
        } catch (e) {
            console.error(`❌ Failed to backup ${model}:`, e.message);
        }
    }

    // Models with Many-to-Many relations needing special handling
    try {
        const productData = await prisma.product.findMany(); // Product is simple but parent to many
        fs.writeFileSync(path.join(BACKUP_DIR, 'product.json'), JSON.stringify(productData, null, 2));
        console.log(`✅ Backed up product (${productData.length} records)`);

        // Feature has m-n with Opportunity
        const featureData = await prisma.feature.findMany({
            include: {
                opportunities: {
                    select: { id: true }
                }
            }
        });
        fs.writeFileSync(path.join(BACKUP_DIR, 'feature.json'), JSON.stringify(featureData, null, 2));
        console.log(`✅ Backed up feature (${featureData.length} records) [Included Opportunities]`);
    } catch (e) {
        console.error(`❌ Failed to backup complex models:`, e.message);
    }

    console.log(`\n🎉 Backup completed to ${BACKUP_DIR}`);
}

backup()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
