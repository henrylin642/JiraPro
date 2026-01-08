'use client';

import React from 'react';
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
import { ArrowUpDown, Filter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type PortfolioItem = {
    id: string;
    type: 'PROJECT' | 'OPPORTUNITY';
    name: string;
    code: string | null;
    status: string;
    value: number;
    probability: number;
    weightedValue: number;
    date: Date | null;
    owner: string | null;
};

type SortConfig = {
    key: keyof PortfolioItem;
    direction: 'asc' | 'desc';
} | null;

export function PortfolioTable({ data }: { data: PortfolioItem[] }) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [filterOwner, setFilterOwner] = useState('');

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    };

    const handleSort = (key: keyof PortfolioItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredData = sortedData.filter(item => {
        if (!filterOwner) return true;
        return item.owner?.toLowerCase().includes(filterOwner.toLowerCase());
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Master Portfolio (Projects & Opportunities)</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by Owner..."
                            value={filterOwner}
                            onChange={(e) => setFilterOwner(e.target.value)}
                            className="pl-8 w-[200px]"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px] cursor-pointer hover:bg-slate-50" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">
                                        Name {sortConfig?.key === 'name' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('value')}>
                                    <div className="flex items-center justify-end">
                                        Value {sortConfig?.key === 'value' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Probability</TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('weightedValue')}>
                                    <div className="flex items-center justify-end">
                                        Weighted Value {sortConfig?.key === 'weightedValue' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Est. End/Close</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{item.name}</span>
                                            {item.code && <span className="text-xs text-muted-foreground">{item.code}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.type === 'PROJECT' ? (
                                            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                                <Briefcase className="w-3 h-3 mr-1" /> Project
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                                                <Target className="w-3 h-3 mr-1" /> Opportunity
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {item.owner || <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.value)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.probability}%
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(item.weightedValue)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {formatDate(item.date)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No matching records found.
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
