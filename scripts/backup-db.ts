
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma/dev.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

async function main() {
    if (!fs.existsSync(DB_PATH)) {
        console.error('Database file not found at:', DB_PATH);
        process.exit(1);
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `dev_backup_${timestamp}.db`);

    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ Database backed up successfully to:\n${backupPath}`);
}

main();
