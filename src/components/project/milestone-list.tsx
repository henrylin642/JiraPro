'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { MilestoneDialog } from './milestone-dialog';
import { deleteMilestone, toggleMilestonePayment } from '@/app/admin/project/actions';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

type Milestone = {
    id: string;
    projectId: string;
    name: string;
    dueDate: Date | string | null;
    amount: any;
    isPaid: boolean;
};

export function MilestoneList({ milestones, projectId }: { milestones: Milestone[], projectId: string }) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleEdit = (m: Milestone) => {
        setEditingMilestone(m);
        setOpenDialog(true);
    };

    const handleCreate = () => {
        setEditingMilestone(null);
        setOpenDialog(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this milestone?')) return;
        setLoadingId(id);
        await deleteMilestone(id, projectId);
        setLoadingId(null);
    };

    const handleTogglePaid = async (m: Milestone) => {
        setLoadingId(m.id);
        await toggleMilestonePayment(m.id, projectId, !m.isPaid);
        setLoadingId(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Milestones</h3>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Milestone
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Milestone Name</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {milestones.map((m) => (
                            <TableRow key={m.id}>
                                <TableCell className="font-medium">{m.name}</TableCell>
                                <TableCell>
                                    <span suppressHydrationWarning>{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'TBD'}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    ${formatNumber(Number(m.amount))}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        variant={m.isPaid ? 'default' : 'outline'}
                                        onClick={() => handleTogglePaid(m)}
                                        className={cn("cursor-pointer select-none", m.isPaid ? "bg-green-600 hover:bg-green-700" : "")}
                                    >
                                        {m.isPaid ? 'Paid' : 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleTogglePaid(m)}
                                        disabled={loadingId === m.id}
                                        title={m.isPaid ? "Mark as Pending" : "Mark as Paid"}
                                    >
                                        <DollarSign className={cn("h-4 w-4", m.isPaid ? "text-green-600" : "text-muted-foreground")} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(m)}
                                        disabled={loadingId === m.id}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(m.id)}
                                        disabled={loadingId === m.id}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {milestones.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No milestones defined. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <MilestoneDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                projectId={projectId}
                milestone={editingMilestone}
            />
        </div>
    );
}
