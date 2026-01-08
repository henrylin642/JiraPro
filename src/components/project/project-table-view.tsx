'use client';

import React from 'react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ArrowRight, MoreHorizontal, Archive, LayoutDashboard, Trash } from 'lucide-react';
import { getProjects, archiveProject, deleteProject } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';
import { ProjectDialog } from '@/components/project/project-dialog';

// Infer the type from the return value of getProjects
type Projects = Awaited<ReturnType<typeof getProjects>>;
type Project = Projects[number];

interface ProjectTableViewProps {
    projects: Projects;
    accounts?: { id: string, name: string }[];
    users?: { id: string, name: string }[];
    serviceAreas?: { id: string, name: string }[];
}

export function ProjectTableView({ projects, accounts = [], users = [], serviceAreas = [] }: ProjectTableViewProps) {
    const router = useRouter();
    const [editingProject, setEditingProject] = React.useState<Project | null>(null);
    const [isEditOpen, setIsEditOpen] = React.useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleArchive = async (id: string) => {
        if (confirm('Are you sure you want to archive this project?')) {
            await archiveProject(id);
            // Optional: Show toast
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete project "${name}"? This action cannot be undone.`)) {
            await deleteProject(id);
        }
    };

    const handleEditClick = (project: Project) => {
        setEditingProject(project);
        setIsEditOpen(true);
    };

    return (
        <div className="rounded-md border">
            {editingProject && (
                <ProjectDialog
                    project={editingProject}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    accounts={accounts}
                    users={users}
                    serviceAreas={serviceAreas}
                />
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service Area</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Personal Cost</TableHead>
                        <TableHead className="text-right">Expense</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        // Calculations (Same as before)
                        const expenseTotal = project.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

                        let personalCost = 0;
                        let billableRevenue = 0;

                        project.tasks.forEach(task => {
                            task.timesheets.forEach(entry => {
                                personalCost += Number(entry.hours) * Number(entry.costRate);
                                billableRevenue += Number(entry.hours) * Number(entry.billableRate);
                            });
                        });

                        const milestoneRevenue = project.milestones.reduce((sum, m) => sum + Number(m.amount), 0);

                        const totalRevenue = milestoneRevenue + billableRevenue;
                        const totalCost = personalCost + expenseTotal;
                        const margin = totalRevenue - totalCost;

                        return (
                            <TableRow key={project.id} className={project.status === 'ARCHIVED' ? 'opacity-50 bg-muted/50' : ''}>
                                <TableCell className="font-medium font-mono text-xs">{project.code || '-'}</TableCell>
                                <TableCell>
                                    <span className="font-medium">{project.name}</span>
                                </TableCell>
                                <TableCell>{project.account?.name || 'Internal'}</TableCell>
                                <TableCell>{project.serviceArea?.name || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={project.status === 'ACTIVE' ? 'default' : (project.status === 'ARCHIVED' ? 'outline' : 'secondary')}>
                                        {project.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{project.manager?.name || '-'}</TableCell>
                                <TableCell className="text-right">{formatCurrency(Number(project.budget))}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{formatCurrency(personalCost)}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{formatCurrency(expenseTotal)}</TableCell>
                                <TableCell className="text-right font-mono text-xs text-green-600">{formatCurrency(totalRevenue)}</TableCell>
                                <TableCell className={`text-right font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(margin)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => router.push(`/admin/project/${project.id}`)}>
                                                <LayoutDashboard className="mr-2 h-4 w-4" /> View Dashboard
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditClick(project)}>
                                                <MoreHorizontal className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleArchive(project.id)} className="text-orange-600">
                                                <Archive className="mr-2 h-4 w-4" /> Archive Project
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleDelete(project.id, project.name)} className="text-red-600">
                                                <Trash className="mr-2 h-4 w-4" /> Delete Project
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
