'use client';

import Link from 'next/link';
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
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateOpportunityStage } from '@/app/admin/crm/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAGE_LABELS, STAGE_ORDER } from '@/lib/crm-constants';

// --- Types ---
type Opportunity = {
    id: string;
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number;
    account: { name: string };
    owner?: { id: string; name: string } | null;
};

type User = {
    id: string;
    name: string;
};

// STAGES removed in favor of STAGE_ORDER from constants

const LOSS_REASONS = [
    "Price too high",
    "Feature gap",
    "Competitor won",
    "No budget",
    "Internal changes",
    "Other"
];

// --- Components ---

function SortableItem({ id, opportunity }: { id: string; opportunity: Opportunity }) {
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
            <Link href={`/admin/crm/${opportunity.id}`} className="block">
                <Card className="cursor-grab hover:shadow-md transition-shadow hover:border-primary/50">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                {opportunity.account.name}
                            </Badge>
                            <div className="flex items-center gap-2">
                                {opportunity.owner && (
                                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                                        {opportunity.owner.name}
                                    </span>
                                )}
                                <span className={`text-[10px] font-mono ${opportunity.stage === 'CLOSED_LOST' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {opportunity.probability}%
                                </span>
                            </div>
                        </div>
                        <h4 className="font-semibold text-xs mb-1 line-clamp-2 leading-tight">{opportunity.title}</h4>
                        <div className="text-xs font-medium text-green-600">
                            ${opportunity.estimatedValue.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}

function Column({ id, title, opportunities }: { id: string; title: string; opportunities: Opportunity[] }) {
    const { setNodeRef } = useSortable({ id });

    const totalValue = opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0);
    const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.estimatedValue * opp.probability / 100), 0);

    return (
        <div className="flex flex-col w-72 min-w-72 bg-muted/30 rounded-lg p-2 mr-4 h-full max-h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">{title}</h3>
                <Badge variant="secondary" className="h-5 text-[10px] px-1.5">{opportunities.length}</Badge>
            </div>
            <div className="mb-2 px-1 text-[10px] text-muted-foreground flex justify-between">
                <span>Total: ${totalValue.toLocaleString()}</span>
                <span>W: ${Math.round(weightedValue).toLocaleString()}</span>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px] pr-1">
                <SortableContext items={opportunities.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                    {opportunities.map((opp) => (
                        <SortableItem key={opp.id} id={opp.id} opportunity={opp} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export function KanbanBoard({ initialOpportunities, users = [] }: { initialOpportunities: Opportunity[], users?: User[] }) {
    const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
    const [selectedOwner, setSelectedOwner] = useState<string>("all");

    // Sync state with props when server revalidates
    React.useEffect(() => {
        setOpportunities(initialOpportunities);
    }, [initialOpportunities]);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Loss Reason Dialog State
    const [lossDialogOpen, setLossDialogOpen] = useState(false);
    const [pendingLostOppId, setPendingLostOppId] = useState<string | null>(null);
    const [lossReason, setLossReason] = useState("");

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

    const filteredOpportunities = useMemo(() => {
        if (selectedOwner === "all") return opportunities;
        if (selectedOwner === "unassigned") return opportunities.filter(o => !o.owner);
        return opportunities.filter(o => o.owner?.id === selectedOwner);
    }, [opportunities, selectedOwner]);

    const columns = useMemo(() => {
        const cols: Record<string, Opportunity[]> = {};
        STAGE_ORDER.forEach((stage) => {
            cols[stage] = filteredOpportunities.filter((o) => o.stage === stage);
        });
        return cols;
    }, [filteredOpportunities]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        // ... (Keep existing drag over logic if complex, but simple version works for dropping on col)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeOpp = opportunities.find((o) => o.id === activeId);
        if (!activeOpp) return;

        let newStage = activeOpp.stage;

        if (STAGE_ORDER.includes(overId)) {
            newStage = overId;
        } else {
            const overOpp = opportunities.find((o) => o.id === overId);
            if (overOpp) {
                newStage = overOpp.stage;
            }
        }

        if (newStage !== activeOpp.stage) {
            // Check for CLOSED_LOST
            if (newStage === 'CLOSED_LOST') {
                setPendingLostOppId(activeId);
                setLossDialogOpen(true);
                return; // Stop here, wait for dialog
            }

            // Normal update
            setOpportunities((prev) =>
                prev.map((o) => (o.id === activeId ? { ...o, stage: newStage } : o))
            );
            await updateOpportunityStage(activeId, newStage);
        }
    }

    async function confirmLoss() {
        if (!pendingLostOppId) return;

        const reason = lossReason || "Other";

        setOpportunities((prev) =>
            prev.map((o) => (o.id === pendingLostOppId ? { ...o, stage: 'CLOSED_LOST' } : o))
        );

        await updateOpportunityStage(pendingLostOppId, 'CLOSED_LOST', reason);

        setLossDialogOpen(false);
        setPendingLostOppId(null);
        setLossReason("");
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4 px-1">
                <div className="w-[200px]">
                    <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Owner" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Owners</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-full overflow-x-auto pb-4">
                    {STAGE_ORDER.map((stage) => (
                        <Column
                            key={stage}
                            id={stage}
                            title={STAGE_LABELS[stage] || stage}
                            opportunities={columns[stage] || []}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <Card className="w-72 cursor-grabbing shadow-xl rotate-2">
                            {(() => {
                                const activeOpportunity = opportunities.find((o) => o.id === activeId);
                                if (!activeOpportunity) return null;
                                return (
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                {activeOpportunity.account.name}
                                            </Badge>
                                            <div className="flex items-center gap-2">
                                                {activeOpportunity.owner && (
                                                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                                                        {activeOpportunity.owner.name}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {activeOpportunity.probability}%
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className="font-semibold text-xs mb-1 line-clamp-2 leading-tight">{activeOpportunity.title}</h4>
                                        <div className="text-sm font-medium text-green-600">
                                            ${activeOpportunity.estimatedValue.toLocaleString()}
                                        </div>
                                    </CardContent>
                                )
                            })()}
                        </Card>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Dialog open={lossDialogOpen} onOpenChange={setLossDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Lost</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason for Loss</Label>
                            <Select value={lossReason} onValueChange={setLossReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOSS_REASONS.map(reason => (
                                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLossDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmLoss}>Confirm Lost</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
