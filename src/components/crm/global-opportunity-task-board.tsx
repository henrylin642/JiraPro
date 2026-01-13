'use client';

import React, { useState, useMemo } from 'react';
import { TaskBoard } from '@/components/project/task-board';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface GlobalOpportunityTaskBoardProps {
    tasks: any[];
    opportunities: { id: string; title: string }[];
}

export function GlobalOpportunityTaskBoard({ tasks, opportunities }: GlobalOpportunityTaskBoardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('all');
    const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

    // Extract unique assignees
    const assignees = useMemo(() => {
        const unique = new Map();
        tasks.forEach(t => {
            if (t.assignee) {
                unique.set(t.assignee.name, t.assignee); // Use name or ID if available
            }
        });
        return Array.from(unique.values());
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesOpportunity = selectedOpportunityId === 'all' || task.opportunityId === selectedOpportunityId;
            const matchesAssignee = selectedAssignee === 'all' || (task.assignee && task.assignee.name === selectedAssignee); // Using name for simplicity if ID not passed consistently

            return matchesSearch && matchesOpportunity && matchesAssignee;
        });
    }, [tasks, searchQuery, selectedOpportunityId, selectedAssignee]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedOpportunityId('all');
        setSelectedAssignee('all');
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-wrap gap-4 items-center bg-card p-3 rounded-lg border">
                <div className="relative w-60">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <Select value={selectedOpportunityId} onValueChange={setSelectedOpportunityId}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by Opportunity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Opportunities</SelectItem>
                        {opportunities.map(opp => (
                            <SelectItem key={opp.id} value={opp.id}>{opp.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {assignees.map((a: any) => (
                            <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(searchQuery || selectedOpportunityId !== 'all' || selectedAssignee !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                        <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                {/* Pass opportunityId only if filtered to specific one, enabling creation context */}
                <TaskBoard
                    initialTasks={filteredTasks}
                    opportunityId={selectedOpportunityId !== 'all' ? selectedOpportunityId : undefined}
                />
            </div>
        </div>
    );
}
