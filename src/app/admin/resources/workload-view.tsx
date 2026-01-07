'use client';

import React from 'react';
import { addDays, format, eachDayOfInterval, isSameDay, isWithinInterval, startOfDay } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Resource = {
    id: string;
    name: string;
    resourceProfile: {
        id: string;
        userId: string;
        capacityHours: number;
    } | null;
};

type Allocation = {
    id: string;
    resourceId: string;
    percentage: number;
    startDate: Date;
    endDate: Date;
    project?: { name: string } | null;
    opportunity?: { title: string } | null;
};

export function WorkloadView({ resources, allocations }: { resources: Resource[], allocations: Allocation[] }) {
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({
        start: today,
        end: addDays(today, 29)
    });

    const CELL_WIDTH = 50;
    const SIDEBAR_WIDTH = 250;

    // Helper to get total allocation for a resource on a specific day
    const getAllocationForDay = (resourceId: string, date: Date) => {
        const activeAllocations = allocations.filter(a =>
            a.resourceId === resourceId &&
            isWithinInterval(date, { start: new Date(a.startDate), end: new Date(a.endDate) })
        );

        const totalPercent = activeAllocations.reduce((sum, a) => sum + a.percentage, 0);

        return { totalPercent, details: activeAllocations };
    };

    const getCellColor = (percent: number) => {
        if (percent === 0) return 'bg-emerald-50 hover:bg-emerald-100'; // Available
        if (percent <= 50) return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'; // Light Load
        if (percent <= 80) return 'bg-blue-100 hover:bg-blue-200 text-blue-700'; // Healthy
        if (percent <= 100) return 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'; // Full
        return 'bg-red-100 hover:bg-red-200 text-red-700'; // Overloaded
    };

    return (
        <TooltipProvider>
            <div className="border rounded-md bg-background">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="flex border-b h-12 sticky top-0 bg-background z-20">
                            <div
                                className="flex-none border-r p-3 font-medium sticky left-0 bg-background z-30 flex items-center"
                                style={{ width: `${SIDEBAR_WIDTH}px` }}
                            >
                                Resource Name
                            </div>
                            <div className="flex">
                                {days.map((day) => (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "flex-none border-r text-center text-xs py-3 flex flex-col justify-center",
                                            format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' ? "bg-muted/30" : ""
                                        )}
                                        style={{ width: `${CELL_WIDTH}px` }}
                                    >
                                        <span className="font-bold text-muted-foreground">{format(day, 'dd')}</span>
                                        <span className="text-[10px] text-muted-foreground/70">{format(day, 'EE')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="relative">
                            {resources.map((resource) => (
                                <div key={resource.id} className="flex h-12 items-center border-b hover:bg-muted/5 transition-colors">
                                    <div
                                        className="flex-none border-r px-4 text-sm font-medium sticky left-0 bg-background z-10 flex items-center truncate h-full"
                                        style={{ width: `${SIDEBAR_WIDTH}px` }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback>{resource.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{resource.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        {days.map((day) => {
                                            const { totalPercent, details } = getAllocationForDay(resource.resourceProfile?.userId || resource.id, day); // Assuming userId matching logic if needed, but resourceId usually matches resource.id in Allocation. 
                                            // Actually based on schema: Allocation.resourceId -> ResourceProfile.id. 
                                            // But resource passed here is User. 
                                            // So we need to match User -> ResourceProfile.id.
                                            // Let's check props. Resources passed are Users. 
                                            // Allocation is linked to ResourceProfile. 
                                            // So we should map User to ResourceProfile ID for lookup.

                                            // Wait, the getAllocationForDay logic needs to know the ResourceProfile ID.
                                            // The resource object here is the User with relation to ResourceProfile used in `resources` prop.
                                            // Let's adjust logic inside map.

                                            const profileId = (resource as any).resourceProfile?.id;
                                            const { totalPercent: tP, details: dets } = getAllocationForDay(profileId, day);

                                            return (
                                                <Tooltip key={day.toISOString()}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                "flex-none border-r flex items-center justify-center text-[10px] font-medium cursor-default transition-colors",
                                                                getCellColor(tP),
                                                                (format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun') && tP === 0 ? "bg-muted/30" : ""
                                                            )}
                                                            style={{ width: `${CELL_WIDTH}px`, height: '100%' }}
                                                        >
                                                            {tP > 0 ? `${tP}%` : ''}
                                                        </div>
                                                    </TooltipTrigger>
                                                    {tP > 0 && (
                                                        <TooltipContent>
                                                            <div className="text-xs space-y-1">
                                                                <div className="font-bold">{format(day, 'MMM dd')} - {tP}% Allocated</div>
                                                                {dets.map(a => (
                                                                    <div key={a.id}>
                                                                        {a.percentage}%: {a.project?.name || a.opportunity?.title || 'Unknown'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
}
