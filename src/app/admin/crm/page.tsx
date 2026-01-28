import React from 'react';
import { getOpportunities, getUsers } from '@/app/admin/crm/actions';
import { getAllTasks } from '@/app/admin/project/actions';
import { getSalesStats } from '@/app/admin/crm/dashboard-actions';
import { getAccounts } from '@/app/admin/crm/account-actions';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { SalesDashboard } from './sales-dashboard';
import { AccountList } from '@/components/crm/account-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineTable } from '@/components/crm/pipeline-table';
import { OpportunityDialog } from '@/components/crm/opportunity-dialog';
import { CrmAnalytics } from '@/components/crm/crm-analytics';
import { GlobalOpportunityTaskBoard } from '@/components/crm/global-opportunity-task-board';
import { getServiceAreas } from '@/app/admin/settings/actions';

export default async function CRMPage() {
    const [opportunities, stats, accounts, users, serviceAreas, allTasks] = await Promise.all([
        getOpportunities(),
        getSalesStats(),
        getAccounts(),
        getUsers(),
        getServiceAreas(),
        getAllTasks()
    ]);

    const opportunityTasks = allTasks.filter(t => t.opportunityId);
    const activeOpportunities = opportunities.filter((opp) => opp.stage !== 'CLOSED_WON' && opp.stage !== 'CLOSED_LOST');
    const healthSummary = {
        totalActive: activeOpportunities.length,
        healthy: activeOpportunities.filter((opp) => (opp.healthScore ?? 0) >= 70).length,
        watch: activeOpportunities.filter((opp) => (opp.healthScore ?? 0) >= 40 && (opp.healthScore ?? 0) < 70).length,
        atRisk: activeOpportunities.filter((opp) => (opp.healthScore ?? 0) < 40).length,
        risks: {
            noRecentActivity: activeOpportunities.filter((opp) => (opp.healthSignals || []).some((signal: { id: string }) => signal.id === 'no_recent_activity')).length,
            noNextStep: activeOpportunities.filter((opp) => (opp.healthSignals || []).some((signal: { id: string }) => signal.id === 'no_next_step')).length,
            closeDateOverdue: activeOpportunities.filter((opp) => (opp.healthSignals || []).some((signal: { id: string }) => signal.id === 'close_date_overdue')).length,
        },
    };

    return (
        <div className="flex flex-col h-screen p-6 bg-background">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
                    <p className="text-muted-foreground">Manage opportunities, accounts, and forecast revenue.</p>
                </div>
                <OpportunityDialog accounts={accounts} users={users} serviceAreas={serviceAreas} />
            </div>

            <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-[600px]">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline (Kanban)</TabsTrigger>

                    <TabsTrigger value="table">Pipeline (Table)</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto mt-4">
                <TabsContent value="dashboard" className="m-0 h-full">
                        <SalesDashboard stats={stats} healthSummary={healthSummary} />
                </TabsContent>

                    <TabsContent value="pipeline" className="m-0 h-full">
                        <KanbanBoard initialOpportunities={opportunities} users={users} />
                    </TabsContent>



                    <TabsContent value="table" className="m-0 h-full">
                        <PipelineTable data={opportunities} />
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
