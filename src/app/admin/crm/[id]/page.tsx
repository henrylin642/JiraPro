import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, DollarSign, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOpportunityById, getResources } from '@/app/admin/crm/actions';
import { getOpportunityById, getResources, getUsers, getAccounts } from '@/app/admin/crm/actions';
import { ResourceBooking } from '@/components/crm/resource-booking';
import { ConvertToProjectDialog } from '@/components/crm/convert-project-dialog';
import { DeleteOpportunityButton } from '@/components/crm/delete-opportunity-button';
import { StageChecklist } from '@/components/crm/stage-checklist';
import { getInteractions } from '@/app/admin/crm/actions';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { OpportunityDialog } from '@/components/crm/opportunity-dialog';
import { Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const opportunity = await getOpportunityById(id);
    const resources = await getResources();
    const interactions = await getInteractions(id);
    const users = await getUsers();
    const accounts = await getAccounts();

    if (!opportunity) {
        notFound();
    }

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
                            trigger={
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Pencil className="h-4 w-4" /> Edit
                                </Button>
                            }
                        />
                        <DeleteOpportunityButton id={opportunity.id} title={opportunity.title} />
                    </div>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-2">{opportunity.title}</h1>
                        <div className="flex gap-2">
                            <ConvertToProjectDialog opportunityId={opportunity.id} opportunityTitle={opportunity.title} />
                            <Badge>{opportunity.stage.replace('_', ' ')}</Badge>
                            {opportunity.expectedCloseDate && (
                                <Badge variant="outline" className="flex gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Target: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4 text-right">
                        <div>
                            <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                <DollarSign className="h-3 w-3" /> Est. Value
                            </div>
                            <div className="text-xl font-bold">
                                ${opportunity.estimatedValue.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                                <Percent className="h-3 w-3" /> Probability
                            </div>
                            <div className="text-xl font-bold">{opportunity.probability}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                <Tabs defaultValue="resources" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="resources">Resource Planning</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
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
