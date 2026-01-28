import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, DollarSign, Percent } from 'lucide-react';
import { TaskBoard } from '@/components/project/task-board';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOpportunityById, getResources, getUsers } from '@/app/admin/crm/actions';
import { getAccounts } from '@/app/admin/crm/account-actions';
import { getInteractions } from '@/app/admin/crm/actions';
import { getServiceAreas } from '@/app/admin/settings/actions';
import { ResourceBooking } from '@/components/crm/resource-booking';
import { ConvertToProjectDialog } from '@/components/crm/convert-project-dialog';
import { DeleteOpportunityButton } from '@/components/crm/delete-opportunity-button';
import { StageChecklist } from '@/components/crm/stage-checklist';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { OpportunityDialog } from '@/components/crm/opportunity-dialog';
import { STAGE_LABELS } from '@/lib/crm-constants';
import { calculateDealHealth } from '@/lib/deal-health';
import { DealHealthCard } from '@/components/crm/deal-health-card';


export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const opportunity = await getOpportunityById(id);
    const resources = await getResources();
    const interactions = await getInteractions(id);
    const users = await getUsers();
    const accounts = await getAccounts();
    const serviceAreas = await getServiceAreas();

    if (!opportunity) {
        notFound();
    }

    const lastInteractionAt = interactions[0]?.date ?? null;
    const openTasks = ((opportunity.tasks as any[]) || []).filter(task => task.status !== 'DONE');
    const dealHealth = calculateDealHealth({
        stage: opportunity.stage,
        checklist: opportunity.checklist,
        ownerId: opportunity.ownerId,
        expectedCloseDate: opportunity.expectedCloseDate,
        estimatedValue: opportunity.estimatedValue,
        serviceAreaId: opportunity.serviceAreaId,
        stageUpdatedAt: opportunity.stageUpdatedAt ?? opportunity.updatedAt,
        lastInteractionAt,
        openTasks: openTasks.map(task => ({ dueDate: task.dueDate })),
        currentProbability: opportunity.probability,
    });

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card px-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin/crm">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{opportunity.account.name}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <OpportunityDialog
                            opportunity={opportunity}
                            accounts={accounts}
                            users={users}
                            serviceAreas={serviceAreas}
                        />
                        <DeleteOpportunityButton id={opportunity.id} title={opportunity.title} />
                    </div>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-2">{opportunity.title}</h1>
                        <div className="flex gap-2">
                            <ConvertToProjectDialog opportunityId={opportunity.id} opportunityTitle={opportunity.title} />
                            <Badge>{STAGE_LABELS[opportunity.stage] || opportunity.stage}</Badge>
                            {opportunity.expectedCloseDate && (
                                <Badge variant="outline" className="flex gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Target: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Owner</div>
                            <div className="font-medium">{opportunity.owner?.name || 'Unassigned'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">$ Est. Value</div>
                            <div className="font-mono font-bold text-xl">${opportunity.estimatedValue.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">% Probability</div>
                            <div className="font-mono font-bold text-xl">{opportunity.probability}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                <Tabs defaultValue="resources" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="resources">Resource Planning</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <div className="space-y-6">
                            <DealHealthCard health={dealHealth} currentProbability={opportunity.probability} />
                            {/* ... existing details ... */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Opportunity Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <StageChecklist
                                        opportunityId={opportunity.id}
                                        stage={opportunity.stage}
                                        initialChecklist={opportunity.checklist ? JSON.parse(opportunity.checklist) : []}
                                    />
                                    <p className="text-muted-foreground">Basic details form would go here...</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="h-[calc(100vh-250px)]">
                        <TaskBoard
                            initialTasks={opportunity.tasks as any[]}
                            opportunityId={opportunity.id}
                        />
                    </TabsContent>



                    <TabsContent value="resources">
                        <ResourceBooking
                            opportunityId={opportunity.id}
                            allocations={opportunity.allocations}
                            resources={resources}
                        />
                    </TabsContent>


                    <TabsContent value="activity">
                        <ActivityTimeline
                            opportunityId={opportunity.id}
                            accountId={opportunity.accountId}
                            interactions={interactions}
                            users={users}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
