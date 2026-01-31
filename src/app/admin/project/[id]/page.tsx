import React from 'react';
import { getProjectById } from '../actions';
import { getExpenseCategories, getServiceAreas } from '@/app/admin/settings/actions';
import { getAccounts } from '@/app/admin/crm/account-actions';
import { getUsers } from '@/app/admin/crm/actions';
import { ProjectSheet } from '@/components/project/project-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, DollarSign, Users } from 'lucide-react';
import { GanttView } from '@/components/project/gantt-view';
import { TaskBoard } from '@/components/project/task-board';
import { MilestoneList } from '@/components/project/milestone-list';
import { FinancialView } from '@/components/project/financial-view';
import { formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ edit?: string }>;
}) {
    const { id } = await params;
    const { edit } = (await searchParams) || {};

    const [rawProject, expenseCategories, serviceAreas, accounts, users] = await Promise.all([
        getProjectById(id),
        getExpenseCategories(),
        getServiceAreas(),
        getAccounts(),
        getUsers()
    ]);
    const { serializeDecimal } = await import('@/lib/serialize');
    const project = serializeDecimal(rawProject);

    if (!project) {
        return <div>Project not found</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <span>{project.code}</span>
                        <span>•</span>
                        <span>{project.account?.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ProjectSheet
                        project={project}
                        trigger={<Button>Edit Project</Button>}
                        accounts={accounts}
                        users={users}
                        serviceAreas={serviceAreas}
                        defaultOpen={edit === '1'}
                    />
                    <Badge variant="outline" className="text-lg px-3 py-1">{project.status}</Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${formatNumber(project.milestones.reduce((sum: number, m: any) => sum + Number(m.amount), 0))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deadline</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(() => {
                                const uniqueMembers = new Set<string>();
                                if (project.managerId) uniqueMembers.add(project.managerId);
                                project.allocations?.forEach((a: any) => {
                                    if (a.resource?.user?.id) uniqueMembers.add(a.resource.user.id);
                                });
                                project.tasks?.forEach((t: any) => {
                                    if (t.assigneeId) uniqueMembers.add(t.assigneeId);
                                });
                                return uniqueMembers.size;
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
                    <TabsTrigger value="board">Task Board</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                <TabsContent value="financials">
                    <FinancialView project={project} expenseCategories={expenseCategories} />
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{project.description || 'No description provided.'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Milestones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MilestoneList milestones={project.milestones} projectId={project.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gantt">
                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GanttView tasks={project.tasks} projectId={project.id} initialDate={new Date()} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="board">
                    <div className="h-[calc(100vh-300px)]">
                        <TaskBoard initialTasks={project.tasks} projectId={project.id} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
