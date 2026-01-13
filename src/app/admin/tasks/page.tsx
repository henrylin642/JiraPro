import React from 'react';
import { GlobalTaskBoard } from '@/components/tasks/global-task-board';
import { getAllTasks, getProjects } from '@/app/admin/project/actions';
import { getOpportunities, getUsers } from '@/app/admin/crm/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function GlobalTasksPage() {
    // 1. Fetch all data in parallel
    const [tasks, projects, opportunities, users] = await Promise.all([
        getAllTasks(),
        getProjects(),
        getOpportunities(),
        getUsers()
    ]);

    // 2. Format options for filters
    const projectOptions = projects.map(p => ({ id: p.id, name: p.name }));
    const opportunityOptions = opportunities.map(o => ({ id: o.id, title: o.title }));
    const userOptions = users.map(u => ({ id: u.id, name: u.name }));

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Global Tasks</h2>
                <p className="text-muted-foreground">
                    Manage all tasks across Projects and Opportunities in one place.
                </p>
            </div>

            <div className="flex-1 min-h-0 bg-background rounded-lg border p-4 shadow-sm">
                <GlobalTaskBoard
                    initialTasks={tasks as any[]} // Cast to match flexible Task type
                    projects={projectOptions}
                    opportunities={opportunityOptions}
                    users={userOptions}
                />
            </div>
        </div>
    );
}
