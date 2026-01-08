import { NextRequest, NextResponse } from 'next/server';
import { getBackupSettings, backupSystem } from '@/app/admin/settings/actions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: NextRequest) {
    // Basic security check (e.g., secret token)
    // For now, we'll allow it to be public or strictly time-checked?
    // In production, checking an Authorization header is strictly recommended.
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    try {
        const settings = await getBackupSettings();

        if (!settings.enabled) {
            return NextResponse.json({ skipped: true, reason: "Backup automated strictly disabled" });
        }

        const now = new Date();
        const currentHour = now.getHours();

        // Check if it's the right hour
        // We allow a window, e.g., currentHour === settings.hour
        // But cron might run multiple times. We need to check if we ALREADY backed up today.

        if (currentHour < settings.hour) {
            return NextResponse.json({ skipped: true, reason: `Too early. Scheduled for ${settings.hour}:00. Current: ${currentHour}:00.` });
        }

        // Define "today" as local time window or UTC?
        // Let's assume standard UTC days for uniqueness check.
        // Or simpler: Check if there is a backup created > Today's start
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const existingBackup = await prisma.systemBackup.findFirst({
            where: {
                createdAt: {
                    gte: todayStart
                }
            }
        });

        if (existingBackup) {
            return NextResponse.json({ skipped: true, reason: "Backup already created today." });
        }

        // Run backup
        console.log("Starting automated backup...");
        const result = await backupSystem();

        if (result.success) {
            return NextResponse.json({ success: true, message: "Backup created successfully." });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

    } catch (error) {
        console.error("Cron backup error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
