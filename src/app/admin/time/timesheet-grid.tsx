'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveTimesheet, TimesheetData } from './actions';
import { ChevronLeft, ChevronRight, Save, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Task = {
    id: string;
    title: string;
    project: { name: string; code: string | null } | null;
    opportunity: { title: string } | null;
};

type TimesheetEntry = {
    id: string;
    taskId: string | null;
    date: Date | string;
    hours: number;
};

interface TimesheetGridProps {
    userId: string;
    initialTasks: Task[]; // Tasks assigned to user
    initialEntries: TimesheetEntry[];
    currentDate: Date;
}

export function TimesheetGrid({ userId, initialTasks, initialEntries, currentDate }: TimesheetGridProps) {
    const router = useRouter();
    const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
    const [loading, setLoading] = useState(false);

    // State to hold grid data: Map<taskId, Map<dateStr, hours>>
    // For simplicity, let's use a flat array of changes or a structured object
    // We need to display rows. Rows = Distinct Tasks from (initialTasks + tasksWithEntries).

    const [activeTaskIds, setActiveTaskIds] = useState<string[]>([]);
    const [entries, setEntries] = useState<{ [key: string]: number }>({}); // key: taskId_dateStr

    useEffect(() => {
        // Initialize rows based on assigned tasks and existing entries
        const taskIds = new Set(initialTasks.map(t => t.id));
        initialEntries.forEach(e => {
            if (e.taskId) taskIds.add(e.taskId);
        });
        setActiveTaskIds(Array.from(taskIds));

        // Initialize entries map
        const entryMap: { [key: string]: number } = {};
        initialEntries.forEach(e => {
            if (e.taskId) {
                const dateStr = new Date(e.date).toISOString().split('T')[0];
                entryMap[`${e.taskId}_${dateStr}`] = e.hours;
            }
        });
        setEntries(entryMap);
    }, [initialTasks, initialEntries]);

    const weekDays = eachDayOfInterval({
        start: weekStart,
        end: addDays(weekStart, 6)
    });

    const handleHourChange = (taskId: string, day: Date, value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) && value !== '') return;

        const dateStr = day.toISOString().split('T')[0];
        setEntries(prev => ({
            ...prev,
            [`${taskId}_${dateStr}`]: value === '' ? 0 : num
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        const dataToSave: TimesheetData[] = [];

        // Convert entries state to Payload
        Object.entries(entries).forEach(([key, hours]) => {
            const [taskId, dateStr] = key.split('_');
            // Only save if within current view? Or save all changes? 
            // Ideally we only save what's changed, but saving all for visible week is easier.

            // Check if date is in current week
            const date = new Date(dateStr);
            if (date >= weekStart && date <= addDays(weekStart, 6)) {
                dataToSave.push({
                    taskId,
                    date: new Date(dateStr),
                    hours: typeof hours === 'number' ? hours : 0
                });
            }
        });

        const res = await saveTimesheet(userId, dataToSave);
        if (res.success) {
            router.refresh();
        } else {
            alert('Failed to save');
        }
        setLoading(false);
    };

    const getTaskName = (id: string) => {
        const t = initialTasks.find(t => t.id === id);
        if (!t) return 'Unknown Task';

        if (t.project) {
            return `${t.project.code || ''} - ${t.title}`;
        } else if (t.opportunity) {
            return `IPP - ${t.title} (${t.opportunity.title})`;
        }
        return t.title;
    };

    // Calculate Totals
    const getDayTotal = (day: Date) => {
        const dateStr = day.toISOString().split('T')[0];
        let total = 0;
        activeTaskIds.forEach(id => {
            total += entries[`${id}_${dateStr}`] || 0;
        });
        return total;
    };

    const getWeekTotal = () => {
        let total = 0;
        weekDays.forEach(day => total += getDayTotal(day));
        return activeTaskIds.length > 0 ? total : 0;
    };

    // Determine input color based on validation 
    // e.g. > 24 hours error

    // Navigation
    const changeWeek = (amount: number) => {
        // Ideally we should navigate via URL query param to let server fetch new week data
        // For now, let's just use router push and rely on page prop update?
        // Wait, activeTaskIds and entries need to re-init from props if we change week.
        const newDate = addDays(weekStart, amount * 7);
        // We'll implementing client-side week switch for view, but we need server data for that week.
        // Simplest: Redirect to ?date=...
        const dateStr = newDate.toISOString().split('T')[0];
        window.location.href = `/admin/time?date=${dateStr}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-semibold text-lg w-48 text-center">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => changeWeek(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-muted-foreground">
                        Weekly Total: <span className="text-foreground font-bold">{getWeekTotal()}h</span>
                    </div>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Timesheet'}
                    </Button>
                </div>
            </div>

            <div className="border rounded-md bg-background overflow-hidden">
                <div className="grid grid-cols-[300px_repeat(7,1fr)_80px]">
                    {/* Header */}
                    <div className="p-3 border-b border-r font-medium bg-muted/50">Task</div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={cn("p-2 border-b border-r text-center", isSameDay(day, new Date()) ? "bg-primary/5" : "")}>
                            <div className="font-medium text-sm">{format(day, 'EEE')}</div>
                            <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
                        </div>
                    ))}
                    <div className="p-3 border-b font-medium bg-muted/50 text-center">Total</div>

                    {/* Rows */}
                    {activeTaskIds.map(taskId => (
                        <React.Fragment key={taskId}>
                            <div className="p-3 border-b border-r truncate text-sm flex items-center h-12" title={getTaskName(taskId)}>
                                {getTaskName(taskId)}
                            </div>
                            {weekDays.map(day => {
                                const dateStr = day.toISOString().split('T')[0];
                                const val = entries[`${taskId}_${dateStr}`] || '';
                                return (
                                    <div key={day.toISOString()} className={cn("border-b border-r p-1 h-12", isSameDay(day, new Date()) ? "bg-primary/5" : "")}>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="24"
                                            className="h-full w-full border-0 text-center shadow-none focus-visible:ring-0 bg-transparent"
                                            value={val === 0 ? '' : val}
                                            onChange={(e) => handleHourChange(taskId, day, e.target.value)}
                                            placeholder="-"
                                        />
                                    </div>
                                );
                            })}
                            <div className="p-3 border-b text-center text-sm font-medium h-12 flex items-center justify-center bg-muted/20">
                                {weekDays.reduce((sum, day) => sum + (entries[`${taskId}_${day.toISOString().split('T')[0]}`] || 0), 0)}
                            </div>
                        </React.Fragment>
                    ))}

                    {/* Empty State */}
                    {activeTaskIds.length === 0 && (
                        <div className="col-span-9 p-8 text-center text-muted-foreground">
                            No tasks assigned. Please contact your manager or add a task manually.
                        </div>
                    )}

                    {/* Footer Totals */}
                    <div className="p-3 border-r font-medium bg-muted/50 text-right">Day Total</div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="p-3 border-r text-center font-bold text-sm bg-muted/50">
                            {getDayTotal(day)}
                        </div>
                    ))}
                    <div className="p-3 text-center font-bold text-sm bg-muted/50">
                        {getWeekTotal()}
                    </div>
                </div>
            </div>

            <div className="text-xs text-muted-foreground">
                * Zero values are not saved. To delete an entry, set it to 0 or clear the input.
            </div>
        </div>
    );
}
