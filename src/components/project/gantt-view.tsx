'use client';

import React, { useMemo, useState } from 'react';
import {
    format,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    addDays,
    differenceInDays,
    startOfMonth,
    endOfMonth,
    eachWeekOfInterval,
    eachMonthOfInterval,
    eachQuarterOfInterval,
    startOfQuarter,
    endOfQuarter,
    getQuarter,
    getYear
} from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskDialog } from './task-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Task = {
    id: string;
    title: string;
    startDate: Date | string | null;
    dueDate: Date | string | null;
    status: string;
    priority: string;
    description?: string;
    assigneeId?: string | null;
    estimatedHours?: number | null;
    assignee: {
        name: string;
        avatarUrl: string | null;
    } | null;
    parentId?: string | null;
};

type TaskNode = Task & {
    children: TaskNode[];
    depth: number;
    isExpanded: boolean;
};

type ViewMode = 'Day' | 'Week' | 'Month' | 'Quarter';

export function GanttView({ tasks, projectId }: { tasks: Task[]; projectId?: string }) {
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('Day');
    const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

    // Toggle Expansion
    const toggleExpand = (taskId: string) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    // Flatten Tree Logic
    const flattenedTasks = useMemo(() => {
        const buildTree = (tasks: Task[]): TaskNode[] => {
            const taskMap = new Map<string, TaskNode>();

            // Initialize Nodes
            tasks.forEach(t => {
                taskMap.set(t.id, { ...t, children: [], depth: 0, isExpanded: true });
            });

            const rootTasks: TaskNode[] = [];

            // Build Hierarchy
            tasks.forEach(t => {
                const node = taskMap.get(t.id)!;
                if (t.parentId && taskMap.has(t.parentId)) {
                    const parent = taskMap.get(t.parentId)!;
                    parent.children.push(node);
                    node.depth = parent.depth + 1;
                } else {
                    rootTasks.push(node);
                }
            });

            return rootTasks; // This is a forest of trees
        };

        // Flatten with visibility check
        const flatten = (nodes: TaskNode[], result: TaskNode[] = []) => {
            for (const node of nodes) {
                result.push(node);
                // Default to expanded if not set
                const isExpanded = expandedTasks[node.id] !== false;
                if (isExpanded && node.children.length > 0) {
                    // Recalculate depth here to ensure correct levels for late binding
                    node.children.forEach(c => c.depth = node.depth + 1);
                    flatten(node.children, result);
                }
            }
            return result;
        };

        const rootNodes = buildTree(tasks);
        return flatten(rootNodes);

    }, [tasks, expandedTasks]);

    const displayTasks = flattenedTasks; // Use this instead of props.tasks for rendering logic

    // 1. Calculate Timeline Range
    const { minDate, maxDate } = useMemo(() => {
        if (displayTasks.length === 0) {
            return { minDate: new Date(), maxDate: addDays(new Date(), 30) };
        }
        const startDates = displayTasks.map(t => t.startDate ? new Date(t.startDate) : new Date()).filter(Boolean);
        const endDates = displayTasks.map(t => t.dueDate ? new Date(t.dueDate) : new Date()).filter(Boolean);

        if (startDates.length === 0) startDates.push(new Date());
        if (endDates.length === 0) endDates.push(addDays(new Date(), 30));

        return {
            minDate: new Date(Math.min(...startDates.map(d => d.getTime()))),
            maxDate: new Date(Math.max(...endDates.map(d => d.getTime())))
        };
    }, [displayTasks]);

    // 2. Configure View Strategy
    const strategy = useMemo(() => {
        let viewStart: Date;
        let viewEnd: Date;
        let columns: { date: Date; label: string; subLabel?: string; width: number }[] = [];
        let groups: { label: string; width: number }[] = [];
        let pxPerDay: number;

        switch (viewMode) {
            case 'Day':
                viewStart = startOfWeek(minDate);
                viewEnd = endOfWeek(addDays(maxDate, 7)); // Add buffer
                pxPerDay = 40;

                const days = eachDayOfInterval({ start: viewStart, end: viewEnd });
                columns = days.map(day => ({
                    date: day,
                    label: format(day, 'dd'),
                    subLabel: format(day, 'EE'),
                    width: 40
                }));

                // Group by Month
                let currentMonth = '';
                let currentWidth = 0;
                columns.forEach(col => {
                    const monthLabel = format(col.date, 'MMMM yyyy');
                    if (monthLabel !== currentMonth) {
                        if (currentMonth) {
                            groups.push({ label: currentMonth, width: currentWidth });
                        }
                        currentMonth = monthLabel;
                        currentWidth = col.width;
                    } else {
                        currentWidth += col.width;
                    }
                });
                if (currentMonth) {
                    groups.push({ label: currentMonth, width: currentWidth });
                }
                break;

            case 'Week':
                viewStart = startOfWeek(minDate);
                viewEnd = endOfWeek(addDays(maxDate, 21)); // Add larger buffer
                const weeks = eachWeekOfInterval({ start: viewStart, end: viewEnd });
                const weekWidth = 100;
                pxPerDay = weekWidth / 7;

                columns = weeks.map(week => ({
                    date: week,
                    label: `Week ${format(week, 'w')}`,
                    subLabel: format(week, 'MMM yyyy'),
                    width: weekWidth
                }));
                // Group by Month
                let currentMonthW = '';
                let currentWidthW = 0;
                columns.forEach(col => {
                    const monthLabel = format(col.date, 'MMMM yyyy');
                    if (monthLabel !== currentMonthW) {
                        if (currentMonthW) {
                            groups.push({ label: currentMonthW, width: currentWidthW });
                        }
                        currentMonthW = monthLabel;
                        currentWidthW = col.width;
                    } else {
                        currentWidthW += col.width;
                    }
                });
                if (currentMonthW) {
                    groups.push({ label: currentMonthW, width: currentWidthW });
                }
                break;

            case 'Month':
                viewStart = startOfMonth(minDate);
                viewEnd = endOfMonth(addDays(maxDate, 60));
                const months = eachMonthOfInterval({ start: viewStart, end: viewEnd });
                const monthWidth = 120;
                pxPerDay = monthWidth / 30; // Approx

                columns = months.map(month => ({
                    date: month,
                    label: format(month, 'MMM'),
                    subLabel: format(month, 'yyyy'),
                    width: monthWidth
                }));
                // Group by Year
                let currentYear = '';
                let currentWidthY = 0;
                columns.forEach(col => {
                    const yearLabel = format(col.date, 'yyyy');
                    if (yearLabel !== currentYear) {
                        if (currentYear) {
                            groups.push({ label: currentYear, width: currentWidthY });
                        }
                        currentYear = yearLabel;
                        currentWidthY = col.width;
                    } else {
                        currentWidthY += col.width;
                    }
                });
                if (currentYear) {
                    groups.push({ label: currentYear, width: currentWidthY });
                }
                break;

            case 'Quarter':
                viewStart = startOfQuarter(minDate);
                viewEnd = endOfQuarter(addDays(maxDate, 120));
                const quarters = eachQuarterOfInterval({ start: viewStart, end: viewEnd });
                const quarterWidth = 150;
                pxPerDay = quarterWidth / 90; // Approx

                columns = quarters.map(quarter => ({
                    date: quarter,
                    label: `Q${getQuarter(quarter)}`,
                    subLabel: format(quarter, 'yyyy'),
                    width: quarterWidth
                }));
                // Group by Year
                let currentYearQ = '';
                let currentWidthQ = 0;
                columns.forEach(col => {
                    const yearLabel = format(col.date, 'yyyy');
                    if (yearLabel !== currentYearQ) {
                        if (currentYearQ) {
                            groups.push({ label: currentYearQ, width: currentWidthQ });
                        }
                        currentYearQ = yearLabel;
                        currentWidthQ = col.width;
                    } else {
                        currentWidthQ += col.width;
                    }
                });
                if (currentYearQ) {
                    groups.push({ label: currentYearQ, width: currentWidthQ });
                }
                break;

            default:
                // Fallback to Day
                viewStart = startOfWeek(minDate);
                viewEnd = endOfWeek(addDays(maxDate, 7));
                pxPerDay = 40;
                columns = eachDayOfInterval({ start: viewStart, end: viewEnd }).map(d => ({ date: d, label: format(d, 'dd'), width: 40 }));
        }

        return { viewStart, viewEnd, columns, pxPerDay, groups };
    }, [viewMode, minDate, maxDate]); // Depend on Memoized dates

    const { viewStart, columns, pxPerDay, groups } = strategy;
    const SIDEBAR_WIDTH = 250;

    return (
        <div className="border rounded-md bg-background flex flex-col h-full w-full max-w-[calc(100vw-10rem)] md:max-w-[calc(100vw-26rem)] overflow-hidden">
            <div className="p-2 border-b flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-4">
                    <h3 className="font-medium text-sm px-2">Gantt View</h3>
                    <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="View Mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Day">Day</SelectItem>
                            <SelectItem value="Week">Week</SelectItem>
                            <SelectItem value="Month">Month</SelectItem>
                            <SelectItem value="Quarter">Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {projectId && (
                    <TaskDialog
                        projectId={projectId}
                        trigger={
                            <Button size="sm" className="h-8 gap-1">
                                <Plus className="h-3.5 w-3.5" />
                                Add Task
                            </Button>
                        }
                    />
                )}
            </div>

            {tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No tasks scheduled. Add a task to get started.</div>
            ) : (
                <ScrollArea className="w-full whitespace-nowrap overflow-x-auto" type="always">
                    <div className="flex flex-col min-w-max">
                        {/* Header */}
                        <div className="flex flex-col sticky top-0 bg-background z-20 shadow-sm">
                            {/* Group Header */}
                            {groups.length > 0 && (
                                <div className="flex border-b h-8 bg-muted/10">
                                    <div className="flex-none border-r" style={{ width: `${SIDEBAR_WIDTH}px` }}></div>
                                    {groups.map((group, i) => (
                                        <div
                                            key={i}
                                            className="flex-none border-r text-center text-xs font-semibold text-muted-foreground flex items-center justify-center truncate"
                                            style={{ width: `${group.width}px` }}
                                        >
                                            {group.label}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Column Header */}
                            <div className="flex border-b h-10">
                                <div
                                    className="flex-none border-r p-3 font-medium sticky left-0 bg-background z-30 flex items-center shadow-[1px_0_5px_rgba(0,0,0,0.05)]"
                                    style={{ width: `${SIDEBAR_WIDTH}px` }}
                                >
                                    Task Name
                                </div>
                                <div className="flex">
                                    {columns.map((col, i) => (
                                        <div
                                            key={col.date.toISOString()}
                                            className={cn(
                                                "flex-none border-r text-center text-xs py-1 flex flex-col justify-center",
                                                viewMode === 'Day' && (format(col.date, 'E') === 'Sat' || format(col.date, 'E') === 'Sun') ? "bg-muted/30" : ""
                                            )}
                                            style={{ width: `${col.width}px` }}
                                        >
                                            <span className="font-medium text-muted-foreground">{col.label}</span>
                                            {col.subLabel && <span className="text-[9px] text-muted-foreground/70">{col.subLabel}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="relative">
                            {/* Grid Background */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                <div className="flex-none border-r" style={{ width: `${SIDEBAR_WIDTH}px` }}></div>
                                {columns.map((col) => (
                                    <div
                                        key={`grid-${col.date.toISOString()}`}
                                        className={cn(
                                            "flex-none border-r h-full",
                                            viewMode === 'Day' && (format(col.date, 'E') === 'Sat' || format(col.date, 'E') === 'Sun') ? "bg-muted/30" : ""
                                        )}
                                        style={{ width: `${col.width}px` }}
                                    ></div>
                                ))}
                            </div>

                            {/* Tasks */}
                            {displayTasks.map((task) => {
                                const tStart = task.startDate ? new Date(task.startDate) : viewStart;
                                const tEnd = task.dueDate ? new Date(task.dueDate) : tStart;

                                const offsetDays = differenceInDays(tStart, viewStart);
                                const durationDays = differenceInDays(tEnd, tStart) + 1;

                                const left = SIDEBAR_WIDTH + (offsetDays * pxPerDay);
                                const width = Math.max(durationDays * pxPerDay, 4); // Minimum width

                                const hasChildren = tasks.some(t => t.parentId === task.id);

                                return (
                                    <div
                                        key={task.id}
                                        className="flex relative h-12 items-center border-b hover:bg-muted/10 transition-colors group"
                                    >
                                        <div
                                            className="flex-none border-r px-4 text-sm font-medium sticky left-0 bg-background z-10 flex items-center justify-between truncate h-full group-hover:bg-muted/10 shadow-[1px_0_5px_rgba(0,0,0,0.05)]"
                                            style={{ width: `${SIDEBAR_WIDTH}px`, paddingLeft: `${16 + (task.depth * 20)}px` }}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                {hasChildren && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }}
                                                        className="h-4 w-4 flex items-center justify-center hover:bg-muted rounded"
                                                    >
                                                        {expandedTasks[task.id] !== false ? "v" : ">"}
                                                    </button>
                                                )}
                                                <span className="truncate cursor-pointer hover:underline" onClick={() => setSelectedTask(task)}>
                                                    {task.title}
                                                </span>
                                            </div>

                                            {task.assignee && (
                                                <Avatar className="h-6 w-6 ml-2">
                                                    <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                                    <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>

                                        {/* Bar */}
                                        <div
                                            className={cn(
                                                "absolute h-6 rounded-sm text-xs flex items-center px-2 truncate shadow-sm border hover:ring-2 ring-primary/50 transition-all cursor-pointer",
                                                task.status === 'DONE' ? "bg-green-100 text-green-700 border-green-200" :
                                                    task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                        "bg-slate-100 text-slate-700 border-slate-200"
                                            )}
                                            style={{
                                                left: `${left}px`,
                                                width: `${width}px`
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            {width > 60 && task.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" style={{ marginLeft: SIDEBAR_WIDTH }} />
                </ScrollArea>
            )}

            {selectedTask && projectId && (
                <TaskDialog
                    task={selectedTask}
                    projectId={projectId}
                    open={!!selectedTask}
                    onOpenChange={(open) => !open && setSelectedTask(null)}
                />
            )}
        </div>
    );
}
