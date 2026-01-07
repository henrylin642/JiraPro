import React from 'react';
import { getTimesheet, getUserTasks } from './actions';
import { TimesheetGrid } from './timesheet-grid';
import prisma from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TimesheetPage({ searchParams }: { searchParams: { date?: string } }) {
    // Determine View Week
    const referenceDate = searchParams.date ? new Date(searchParams.date) : new Date();
    const startDate = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(referenceDate, { weekStartsOn: 1 });

    // Identify User (In production, use session/auth)
    // For now, picking the first MANAGER or first User as 'Current User' demo
    let userId = '';
    const demoUser = await prisma.user.findFirst({
        where: { role: 'MANAGER' } // Default to manager for demo
    }) || await prisma.user.findFirst();

    if (demoUser) userId = demoUser.id;
    else return <div>No users found. Please seed database.</div>;

    // Fetch Data
    const tasks = await getUserTasks(userId);
    const timesheetEntries = await getTimesheet(userId, startDate, endDate);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Timesheets</h2>
                <p className="text-muted-foreground">
                    Logging time for <span className="font-semibold text-foreground">{demoUser.name}</span>
                </p>
            </div>

            <TimesheetGrid
                userId={userId}
                initialTasks={tasks}
                initialEntries={timesheetEntries}
                currentDate={referenceDate}
            />
        </div>
    );
}
