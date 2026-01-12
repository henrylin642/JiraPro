'use client';

import { useState, useMemo } from 'react';
import { TaskBoard } from './task-board';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface GlobalTaskBoardProps {
    tasks: any[];
    projects: any[];
    users: any[];
}

export function GlobalTaskBoard({ tasks, projects, users }: GlobalTaskBoardProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all');

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesProject = selectedProjectId === 'all' ||
                task.projectId === selectedProjectId ||
                task.project?.id === selectedProjectId;

            const matchesAssignee = selectedAssigneeId === 'all' ||
                task.assigneeId === selectedAssigneeId ||
                task.assignee?.id === selectedAssigneeId;

            return matchesProject && matchesAssignee;
        });
    }, [tasks, selectedProjectId, selectedAssigneeId]);

    return (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Global Task Board</CardTitle>
                <div className="flex gap-4">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Assignees" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[600px]">
                    <TaskBoard initialTasks={filteredTasks} />
                </div>
            </CardContent>
        </Card>
    );
}
