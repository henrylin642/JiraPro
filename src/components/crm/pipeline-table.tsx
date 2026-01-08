'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';

type Opportunity = {
    id: string;
    title: string;
    stage: string;
    probability: number;
    estimatedValue: number;
    account: { name: string };
    owner?: { id: string; name: string } | null;
    serviceArea?: { name: string } | null;
    expectedCloseDate?: Date | string | null;
};

type SortState = {
    key: keyof Opportunity | 'accountName' | 'ownerName' | 'serviceAreaName';
    direction: 'asc' | 'desc';
};

export function PipelineTable({ data }: { data: Opportunity[] }) {
    const [sortConfig, setSortConfig] = useState<SortState | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    };

    const handleSort = (key: SortState['key']) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortValue = (item: Opportunity, key: SortState['key']) => {
        if (key === 'accountName') return item.account.name;
        if (key === 'ownerName') return item.owner?.name || '';
        if (key === 'serviceAreaName') return item.serviceArea?.name || '';
        return item[key as keyof Opportunity];
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Opportunities List</CardTitle>
                <div className="text-sm text-muted-foreground">
                    {sortedData.length} records
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px] cursor-pointer hover:bg-slate-50" onClick={() => handleSort('title')}>
                                    <div className="flex items-center">
                                        Title {sortConfig?.key === 'title' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('accountName')}>
                                    <div className="flex items-center">
                                        Account {sortConfig?.key === 'accountName' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('serviceAreaName')}>
                                    <div className="flex items-center">
                                        Service Area {sortConfig?.key === 'serviceAreaName' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('ownerName')}>
                                    <div className="flex items-center">
                                        Owner {sortConfig?.key === 'ownerName' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-50" onClick={() => handleSort('stage')}>
                                    <div className="flex items-center">
                                        Stage {sortConfig?.key === 'stage' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('estimatedValue')}>
                                    <div className="flex items-center justify-end">
                                        Value {sortConfig?.key === 'estimatedValue' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('probability')}>
                                    <div className="flex items-center justify-end">
                                        Prob. {sortConfig?.key === 'probability' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('expectedCloseDate')}>
                                    <div className="flex items-center justify-end">
                                        Target Date {sortConfig?.key === 'expectedCloseDate' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((item) => (
                                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/crm/${item.id}`} className="block w-full h-full hover:underline">
                                            {item.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.account.name}</TableCell>
                                    <TableCell>{item.serviceArea?.name || '-'}</TableCell>
                                    <TableCell>
                                        {item.owner ? (
                                            <Badge variant="outline" className="bg-muted text-muted-foreground font-normal">
                                                {item.owner.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.stage.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        {formatCurrency(item.estimatedValue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.probability}%
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {formatDate(item.expectedCloseDate)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No opportunities found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
