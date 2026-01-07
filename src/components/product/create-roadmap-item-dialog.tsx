'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

import { createRoadmapItem, updateRoadmapItem } from '@/app/admin/product/actions';
import { format } from 'date-fns';

interface CreateRoadmapItemDialogProps {
    productId: string;
    productName: string;
    item?: {
        id: string;
        title: string;
        version: string | null;
        startDate: Date | string;
        endDate: Date | string;
    };
    trigger?: React.ReactNode;
}

export function CreateRoadmapItemDialog({ productId, productName, item, trigger }: CreateRoadmapItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Helper to format date for input type="date"
    const formatDate = (date: Date | string) => {
        if (!date) return '';
        const d = new Date(date);
        return format(d, 'yyyy-MM-dd');
    };

    const [title, setTitle] = useState(item?.title || '');
    const [version, setVersion] = useState(item?.version || '');
    const [startDate, setStartDate] = useState(item?.startDate ? formatDate(item.startDate) : '');
    const [endDate, setEndDate] = useState(item?.endDate ? formatDate(item.endDate) : '');

    const isEdit = !!item;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isEdit && item) {
                await updateRoadmapItem(item.id, {
                    title,
                    version,
                    startDate: start,
                    endDate: end
                });
            } else {
                await createRoadmapItem({
                    productId,
                    title,
                    version,
                    startDate: start,
                    endDate: end
                });
            }
            setOpen(false);
            if (!isEdit) {
                setTitle('');
                setVersion('');
                setStartDate('');
                setEndDate('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        Plan Item
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Roadmap Item' : `Plan Roadmap for ${productName}`}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Item Name</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Q1 Release"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="version">Version (Optional)</Label>
                        <Input
                            id="version"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="e.g. v1.0"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (isEdit ? 'Update Item' : 'Add to Roadmap')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
