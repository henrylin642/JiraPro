'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createAllocation, deleteAllocation } from '@/app/admin/crm/actions';
import { cn } from '@/lib/utils';

type Resource = {
    id: string;
    user: {
        name: string;
        avatarUrl: string | null;
    };
    title: string | null;
    costRate: number;
};

type Allocation = {
    id: string;
    resource: Resource;
    startDate: Date;
    endDate: Date;
    percentage: number;
    type: string;
};

export function ResourceBooking({
    opportunityId,
    allocations,
    resources,
}: {
    opportunityId: string;
    allocations: Allocation[];
    resources: Resource[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
    const [percentage, setPercentage] = useState([50]);

    const handleCreate = async () => {
        if (!selectedResourceId || !dateRange?.from || !dateRange?.to) return;

        await createAllocation({
            opportunityId,
            resourceId: selectedResourceId,
            startDate: dateRange.from,
            endDate: dateRange.to,
            percentage: percentage[0],
        });
        setIsOpen(false);
        // Reset form
        setSelectedResourceId('');
        setDateRange(undefined);
        setPercentage([50]);
    };

    const handleDelete = async (id: string) => {
        await deleteAllocation(id);
    };

    // Calculate total estimated cost
    const totalCost = allocations.reduce((sum, alloc) => {
        const weeks = (alloc.endDate.getTime() - alloc.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
        const hours = weeks * 40 * (alloc.percentage / 100);
        return sum + hours * alloc.resource.costRate;
    }, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Resource Planning (Soft Booking)</h3>
                    <p className="text-sm text-muted-foreground">
                        Reserve resources for this opportunity to estimate costs and ensure availability.
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Soft Book Resource</DialogTitle>
                            <DialogDescription>
                                Reserve a team member's time. This will not be finalized until the deal is won.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Resource</label>
                                <Select onValueChange={setSelectedResourceId} value={selectedResourceId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {resources.map((res) => (
                                            <SelectItem key={res.id} value={res.id}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback>{res.user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{res.user.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        ({res.title})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Duration</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={'outline'}
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !dateRange && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                                                        {format(dateRange.to, 'LLL dd, y')}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, 'LLL dd, y')
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={(range: any) => setDateRange(range)}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Allocation %</label>
                                    <span className="text-sm text-muted-foreground">{percentage[0]}%</span>
                                </div>
                                <Slider
                                    defaultValue={[50]}
                                    max={100}
                                    step={10}
                                    value={percentage}
                                    onValueChange={setPercentage}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Book Resource</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Estimated Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${Math.round(totalCost).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Based on resource cost rates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Headcount Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allocations.length}</div>
                        <p className="text-xs text-muted-foreground">Team members booked</p>
                    </CardContent>
                </Card>
            </div>

            {/* Allocation List */}
            <div className="rounded-md border">
                <div className="p-4">
                    <h4 className="mb-4 text-sm font-medium leading-none">Current Allocations</h4>
                    {allocations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No resources booked yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allocations.map((alloc) => (
                                <div
                                    key={alloc.id}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>{alloc.resource.user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{alloc.resource.user.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {alloc.resource.title} • {alloc.percentage}% Allocation
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {format(new Date(alloc.startDate), 'MMM d')} -{' '}
                                                {format(new Date(alloc.endDate), 'MMM d, yyyy')}
                                            </div>
                                            <Badge variant="secondary" className="mt-1">
                                                {alloc.type}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90"
                                            onClick={() => handleDelete(alloc.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
