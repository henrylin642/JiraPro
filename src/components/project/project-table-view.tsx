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
import { ArrowRight, MoreHorizontal, Archive, LayoutDashboard, Trash, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import { getProjects, archiveProject, deleteProject } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';
import { ProjectSheet } from '@/components/project/project-sheet';
import { formatNumber } from '@/lib/format';

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
    const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());

    const toggleExpand = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const formatCurrency = (amount: number) => `$${formatNumber(amount)}`;

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
                <ProjectSheet
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
                        <TableHead className="w-[50px]"></TableHead>
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

                        const isExpanded = expandedProjects.has(project.id);

                        return (
                            <React.Fragment key={project.id}>
                                <TableRow className={project.status === 'ARCHIVED' ? 'opacity-50 bg-muted/50' : ''}>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleExpand(project.id)}>
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-medium font-mono text-xs">{project.code || '-'}</TableCell>
                                    <TableCell>
                                        <span
                                            className="font-medium cursor-pointer hover:underline text-primary"
                                            onClick={() => handleEditClick(project)}
                                        >
                                            {project.name}
                                        </span>
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
                                {isExpanded && (
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={13} className="p-4">
                                            <div className="pl-12">
                                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                    Milestones
                                                    <Badge variant="outline" className="text-xs">{project.milestones.length}</Badge>
                                                </h4>
                                                {project.milestones.length > 0 ? (
                                                    <div className="border rounded-md bg-background overflow-hidden">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-muted/50">
                                                                    <TableHead>Milestone Name</TableHead>
                                                                    <TableHead>Due Date</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead className="text-right">Amount</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {project.milestones.map(milestone => (
                                                                    <TableRow key={milestone.id}>
                                                                        <TableCell className="font-medium">{milestone.name}</TableCell>
                                                                        <TableCell>
                                                                            {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '-'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant={milestone.isPaid ? 'secondary' : 'outline'} className={milestone.isPaid ? 'bg-green-100 text-green-800' : ''}>
                                                                                {milestone.isPaid ? <><Check className="w-3 h-3 mr-1" /> Paid</> : 'Pending'}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-mono">
                                                                            {formatCurrency(Number(milestone.amount))}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground italic p-4 border rounded-md bg-background/50 border-dashed text-center">
                                                        No milestones defined for this project.
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
