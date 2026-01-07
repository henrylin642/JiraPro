import React from 'react';
import { getOpportunities } from './actions';
import { getSalesStats } from './dashboard-actions';
import { getAccounts } from './account-actions';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { SalesDashboard } from './sales-dashboard';
import { AccountList } from '@/components/crm/account-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AddOpportunityDialog } from '@/components/crm/add-opportunity-dialog';
import { CrmAnalytics } from '@/components/crm/crm-analytics';

export default async function CRMPage() {
    const opportunities = await getOpportunities();
    const stats = await getSalesStats();
    const accounts = await getAccounts();

    return (
        <div className="flex flex-col h-screen p-6 bg-background">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
                    <p className="text-muted-foreground">Manage opportunities, accounts, and forecast revenue.</p>
                </div>
                <AddOpportunityDialog accounts={accounts} />
            </div>

            <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-[500px]">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline (Kanban)</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto mt-4">
                    <TabsContent value="dashboard" className="m-0 h-full">
                        <SalesDashboard stats={stats} />
                    </TabsContent>

                    <TabsContent value="pipeline" className="m-0 h-full">
                        <KanbanBoard initialOpportunities={opportunities} />
                    </TabsContent>

                    <TabsContent value="accounts" className="m-0 h-full">
                        <AccountList data={accounts} />
                    </TabsContent>

                    <TabsContent value="reports" className="m-0 h-full">
                        <CrmAnalytics />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
