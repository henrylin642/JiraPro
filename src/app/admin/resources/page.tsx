import React from 'react';
import { getResources, getAllocations } from './actions';
import { ResourceList } from './resource-list';
import { WorkloadView } from './workload-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ResourcesPage() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        redirect('/admin');
    }

    const resources = await getResources();

    // Fetch allocations for the next 30 days
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    const allocations = await getAllocations(today, endDate);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resource Pool</h2>
                    <p className="text-muted-foreground">Manage employees, skills, rates, and capacity.</p>
                </div>
            </div>

            <Tabs defaultValue="pool" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pool">Resource Pool</TabsTrigger>
                    <TabsTrigger value="workload">Workload View</TabsTrigger>
                </TabsList>

                <TabsContent value="pool" className="space-y-4">
                    <ResourceList data={resources} />
                </TabsContent>

                <TabsContent value="workload" className="space-y-4">
                    <div className="rounded-md border p-1 bg-white dark:bg-black">
                        <WorkloadView resources={resources} allocations={allocations} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
