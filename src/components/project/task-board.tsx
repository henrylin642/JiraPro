'use client';

import React, { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateTaskStatus } from '@/app/admin/project/actions';

// --- Types ---
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
    opportunityId?: string | null;
    opportunity?: {
        id: string;
        title: string;
    } | null;
};

const STAGES = [
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'DONE',
];

// --- Components ---

function SortableItem({ id, task, onClick }: { id: string; task: Task; onClick: (task: Task) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <Card
                className="cursor-grab hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={(e) => {
                    // Prevent click if dragging or if clicking directly on a button (if any)
                    // dnd-kit normally suppresses click events during drag, but good to be safe
                    onClick(task);
                }}
            >
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant={
                            task.priority === 'URGENT' ? 'destructive' :
                                task.priority === 'HIGH' ? 'default' : 'secondary'
                        } className="text-[10px] px-1 py-0">
                            {task.priority}
                        </Badge>
                        {task.project && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 max-w-[100px] truncate">
                                {task.project.name}
                            </Badge>
                        )}
                        {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                    {task.opportunity && (
                        <div className="mb-2">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-200 text-orange-700 bg-orange-50 max-w-full truncate">
                                Opp: {task.opportunity.title}
                            </Badge>
                        </div>
                    )}
                    <h4 className="font-medium text-sm mb-3 line-clamp-2">{task.title}</h4>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            {task.assignee ? (
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                    <AvatarFallback className="text-[9px]">{task.assignee.name[0]}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px]">?</div>
                            )}
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                {task.assignee?.name || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Column({ id, title, tasks, onTaskClick }: { id: string; title: string; tasks: Task[]; onTaskClick: (task: Task) => void }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div className="flex flex-col w-72 min-w-72 bg-muted/30 rounded-lg p-3 mr-4 h-full max-h-[calc(100vh-250px)]">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-bold text-sm text-foreground">{title}</h3>
                <Badge variant="secondary" className="bg-background">{tasks.length}</Badge>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableItem key={task.id} id={task.id} task={task} onClick={onTaskClick} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './task-dialog';

// ... (Imports remain similar, added TaskDialog and Button)

export function TaskBoard({
    initialTasks,
    projectId,
    opportunityId,
    projects = [],
    opportunities = []
}: {
    initialTasks: Task[];
    projectId?: string;
    opportunityId?: string;
    projects?: { id: string; name: string }[];
    opportunities?: { id: string; title: string }[];
}) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    // ... existing hooks ...

    // ... existing columns memo ...

    // ... existing drag handlers ... (already updated handleDragEnd in previous tool call, so we just need to match the StartLine/EndLine for the component definition and return)
    // Wait, I cannot edit non-contiguous lines easily with replace_file_content if I want to update function signature AND TaskDialog props at end.
    // I will use multi_replace for this file or just do it in two steps.
    // Let's check where the function definition starts. Line 149.
    // And TaskDialog usage is at line 284.

    // I will restart this specific tool call to better use multi_replace_file_content to cover both spots or just focus on one.
    // I already did handleDragEnd.
    // Let's update function signature first.



    // Sync state with props if revalidated (optional, but good practice if using optimistic UI heavily)
    React.useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns = useMemo(() => {
        const cols: Record<string, Task[]> = {};
        STAGES.forEach((stage) => {
            cols[stage] = tasks.filter((t) => t.status === stage);
        });
        return cols;
    }, [tasks]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.status;

        if (STAGES.includes(overId)) {
            newStatus = overId;
        } else {
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus !== activeTask.status) {
            // Optimistic Update
            setTasks((prev) =>
                prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
            );
            // Determine context
            const targetProjectId = activeTask.projectId || activeTask.project?.id || projectId;
            const targetOpportunityId = activeTask.opportunityId || opportunityId;

            if (targetProjectId || targetOpportunityId) {
                await updateTaskStatus(activeId, targetProjectId, newStatus, targetOpportunityId);
            } else {
                console.error("Missing context (projectId or opportunityId) for task update");
            }
        }
    }

    const activeTask = useMemo(
        () => tasks.find((t) => t.id === activeId),
        [activeId, tasks]
    );

    const openEditDialog = (task: Task) => {
        setEditingTask(task);
        setIsTaskDialogOpen(true);
    };

    const openNewTaskDialog = () => {
        setEditingTask(null);
        setIsTaskDialogOpen(true);
    };

    return (
        <div className="h-full flex flex-col">
            {(projectId || opportunityId) && (
                <div className="flex justify-end mb-4">
                    <Button onClick={openNewTaskDialog} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </div>
            )}

            {/* Always show Add button if no specific context but lists are provided (Global view) */}
            {(!projectId && !opportunityId && (projects.length > 0 || opportunities.length > 0)) && (
                <div className="flex justify-end mb-4">
                    <Button onClick={openNewTaskDialog} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-full overflow-x-auto pb-4">
                    {STAGES.map((stage) => (
                        <Column
                            key={stage}
                            id={stage}
                            title={stage.replace('_', ' ')}
                            tasks={columns[stage] || []}
                            onTaskClick={openEditDialog}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <Card className="w-72 cursor-grabbing shadow-xl rotate-2">
                            <CardContent className="p-4">
                                <h4 className="font-medium text-sm mb-3">{activeTask.title}</h4>
                            </CardContent>
                        </Card>
                    ) : null}
                </DragOverlay>
            </DndContext>


            {/* Always render dialog for updates, but context handling is inside dialog now */}
            {(projectId || opportunityId || projects.length > 0 || opportunities.length > 0) && (
                <TaskDialog
                    projectId={projectId}
                    opportunityId={opportunityId}
                    task={editingTask}
                    open={isTaskDialogOpen}
                    onOpenChange={setIsTaskDialogOpen}
                    projects={projects}
                    opportunities={opportunities}
                />
            )}
        </div>
    );
}

// Helper Components modifications needed in SortableItem and Column

