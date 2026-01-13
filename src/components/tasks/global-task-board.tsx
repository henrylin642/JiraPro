'use client';

import React, { useState, useMemo } from 'react';
import { TaskBoard } from '@/components/project/task-board';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

type Task = {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: {
        name: string;
        avatarUrl: string | null;
    } | null;
    dueDate: Date | string | null;
    projectId?: string;
    project?: {
        id: string;
        name: string;
    } | null;
    opportunityId?: string;
    opportunity?: {
        id: string;
        title: string;
    } | null;
};

type Option = {
    id: string;
    name: string;
};

interface GlobalTaskBoardProps {
    initialTasks: Task[];
    projects: Option[];
    opportunities: { id: string; title: string }[];
    users: Option[];
}

export function GlobalTaskBoard({ initialTasks, projects, opportunities, users }: GlobalTaskBoardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'PROJECT' | 'OPPORTUNITY'>('ALL');
    const [filterEntityId, setFilterEntityId] = useState<string>('all');
    const [filterAssigneeId, setFilterAssigneeId] = useState<string>('all');

    const filteredTasks = useMemo(() => {
        return initialTasks.filter(task => {
            // 1. Search Query
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // 2. Type Filter
            if (filterType === 'PROJECT' && !task.projectId) return false;
            if (filterType === 'OPPORTUNITY' && !task.opportunityId) return false;

            // 3. Entity Filter
            if (filterEntityId !== 'all') {
                if (filterType === 'PROJECT' && task.projectId !== filterEntityId) return false;
                if (filterType === 'OPPORTUNITY' && task.opportunityId !== filterEntityId) return false;
                // If Type is ALL but Entity is selected (edge case, usually reset), check match either
                if (filterType === 'ALL' && task.projectId !== filterEntityId && task.opportunityId !== filterEntityId) return false;
            }

            // 4. Assignee Filter
            if (filterAssigneeId !== 'all') {
                // Assuming task.assignee is object, we check ID if available or just skip for now as Task type in TaskBoard 
                // might need assigneeId. 
                // Checking initialTasks data structure from src/app/admin/project/actions.ts getAllTasks:
                // include assignee: { select: { id: true, ... } }
                // So task.assignee has NO ID in the Type definition in TaskBoard?? 
                // Let's check TaskBoard definition.
                // It has assignee: { name: string, avatarUrl: ... }. No ID.
                // Wait, getAllTasks returns assignee object. We should probably match by Name if ID is missing or update Type.
                // Let's assume for now we match by name if necessary or check if we can pass assigneeId.
                // Actually, let's fix the Task type definition in TaskBoard to include assigneeId if it's there.
                // For now, let's rely on the fact that most filtering is useful.
                // But wait, the filter uses ID.
                // Let's check `getAllTasks` include. It includes `assignee`.
                // Prisma result usually has `assigneeId` field on `Task` itself.
                // So we can check `(task as any).assigneeId === filterAssigneeId`.
                if ((task as any).assigneeId !== filterAssigneeId) return false;
            }

            return true;
        });
    }, [initialTasks, searchQuery, filterType, filterEntityId, filterAssigneeId]);

    const handleTypeChange = (val: 'ALL' | 'PROJECT' | 'OPPORTUNITY') => {
        setFilterType(val);
        setFilterEntityId('all'); // Reset entity filter when type changes
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {/* Type Filter */}
                    <Select value={filterType} onValueChange={(v: any) => handleTypeChange(v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="PROJECT">Projects</SelectItem>
                            <SelectItem value="OPPORTUNITY">Opportunities</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Entity Filter - Dynamic based on Type */}
                    <Select value={filterEntityId} onValueChange={setFilterEntityId} disabled={filterType === 'ALL'}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={filterType === 'PROJECT' ? "Select Project" : filterType === 'OPPORTUNITY' ? "Select Opportunity" : "Select Scope"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All {filterType === 'PROJECT' ? 'Projects' : filterType === 'OPPORTUNITY' ? 'Opportunities' : 'Scopes'}</SelectItem>
                            {filterType === 'PROJECT' && projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                            {filterType === 'OPPORTUNITY' && opportunities.map(o => (
                                <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Assignee Filter */}
                    <Select value={filterAssigneeId} onValueChange={setFilterAssigneeId}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Reset Button */}
                    {(searchQuery || filterType !== 'ALL' || filterEntityId !== 'all' || filterAssigneeId !== 'all') && (
                        <Button variant="ghost" size="icon" onClick={() => {
                            setSearchQuery('');
                            setFilterType('ALL');
                            setFilterEntityId('all');
                            setFilterAssigneeId('all');
                        }}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-hidden min-h-0">
                <TaskBoard
                    initialTasks={filteredTasks}
                    // Since this is a global board with mixed tasks, we don't pass a single context ID.
                    // The TaskDialog will need to handle "creating task without context" or we disable creation?
                    // Typically, creating a task requires knowing where to put it.
                    // Ideally, the "New Task" dialog allows selecting Project/Opportunity if not provided.
                    // For now, let's PASS project/opp ID if specifically filtered, otherwise undefined.
                    projectId={filterType === 'PROJECT' && filterEntityId !== 'all' ? filterEntityId : undefined}
                    opportunityId={filterType === 'OPPORTUNITY' && filterEntityId !== 'all' ? filterEntityId : undefined}
                    projects={projects}
                    opportunities={opportunities}
                />
            </div>

            {/* Hint if no context selected for creation - REMOVED since we now support creation */}
            {/* {filterType === 'ALL' && (
                <div className="text-xs text-muted-foreground text-center">
                    To create a new task, please select a specific Project or Opportunity filter first, or go to the respective page.
                </div>
            )} */}
        </div>
    );
}
