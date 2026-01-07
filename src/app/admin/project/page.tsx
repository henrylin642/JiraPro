import React from 'react';
import Link from 'next/link';
import { getProjects } from './actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Users, CheckSquare, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { ProjectDialog } from '@/components/project/project-dialog';
import { ProjectTableView } from '@/components/project/project-table-view';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    const projects = await getProjects();
    const { view } = await searchParams;
    const isTableView = view !== 'gallery';

    return (
        <div className="p-6 space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage ongoing projects, milestones, and resources.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-muted p-1 rounded-md flex">
                        <Link href="/admin/project?view=gallery">
                            <Button variant={!isTableView ? "secondary" : "ghost"} size="sm" className="h-8 px-2">
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/project?view=table">
                            <Button variant={isTableView ? "secondary" : "ghost"} size="sm" className="h-8 px-2">
                                <List className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <ProjectDialog trigger={<Button>New Project</Button>} />
                </div>
            </div>

            {isTableView ? (
                <ProjectTableView projects={projects} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
                        const totalTasks = project.tasks.length;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                        return (
                            <Card key={project.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{project.name}</CardTitle>
                                            <CardDescription>{project.account?.name || 'Internal'}</CardDescription>
                                        </div>
                                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{Math.round(progress)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Users className="mr-2 h-4 w-4" />
                                            {project.manager?.name || 'Unassigned'}
                                        </div>
                                        <div className="flex items-center text-muted-foreground col-span-2">
                                            <CheckSquare className="mr-2 h-4 w-4" />
                                            {completedTasks} / {totalTasks} Tasks Completed
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <Link href={`/admin/project/${project.id}`} className="w-full">
                                        <Button variant="ghost" className="w-full justify-between">
                                            View Dashboard <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
