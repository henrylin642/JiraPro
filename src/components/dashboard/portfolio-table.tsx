'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import Link from 'next/link';
import { ArrowUpDown, Search, Briefcase, Target, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HealthBadge } from '@/components/crm/health-badge';

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
    serviceArea: string | null;
    healthScore?: number | null;
    riskScore?: number | null;
    client?: string | null;
};

type SortConfig = {
    key: keyof PortfolioItem;
    direction: 'asc' | 'desc';
} | null;

export function PortfolioTable({ data }: { data: PortfolioItem[] }) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [filterOwner, setFilterOwner] = useState('');
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const topScrollRef = useRef<HTMLDivElement | null>(null);
    const topSpacerRef = useRef<HTMLDivElement | null>(null);
    const tableRef = useRef<HTMLTableElement | null>(null);
    const syncLock = useRef(false);

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

    const formatRisk = (risk?: number | null) => {
        if (risk === null || risk === undefined) return '-';
        return `${Math.round(risk)}%`;
    };

    const getRiskTone = (risk?: number | null) => {
        if (risk === null || risk === undefined) return 'bg-muted text-muted-foreground border-muted';
        if (risk >= 60) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (risk >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

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

    useEffect(() => {
        const updateTopWidth = () => {
            if (!scrollRef.current || !topSpacerRef.current) return;
            topSpacerRef.current.style.width = `${scrollRef.current.scrollWidth}px`;
        };

        updateTopWidth();
        const observer = new ResizeObserver(updateTopWidth);
        if (scrollRef.current) observer.observe(scrollRef.current);
        if (tableRef.current) observer.observe(tableRef.current);

        return () => observer.disconnect();
    }, []);

    const handleTopScroll = () => {
        if (syncLock.current || !scrollRef.current || !topScrollRef.current) return;
        syncLock.current = true;
        scrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
        requestAnimationFrame(() => {
            syncLock.current = false;
        });
    };

    const handleMainScroll = () => {
        if (syncLock.current || !scrollRef.current || !topScrollRef.current) return;
        syncLock.current = true;
        topScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
        requestAnimationFrame(() => {
            syncLock.current = false;
        });
    };

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
                <div className="space-y-2">
                    <div
                        ref={topScrollRef}
                        className="h-3 overflow-x-auto overflow-y-hidden rounded-md border bg-muted/20"
                        onScroll={handleTopScroll}
                    >
                        <div ref={topSpacerRef} className="h-3" />
                    </div>
                    <div
                        ref={scrollRef}
                        className="rounded-md border overflow-x-auto"
                        onScroll={handleMainScroll}
                    >
                        <Table ref={tableRef} className="min-w-[1200px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 z-30 w-[300px] border-r bg-background cursor-pointer hover:bg-slate-50" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">
                                            Name {sortConfig?.key === 'name' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                        </div>
                                    </TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Service Area</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('value')}>
                                        <div className="flex items-center justify-end">
                                            Value {sortConfig?.key === 'value' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center">Health</TableHead>
                                    <TableHead className="text-center">Risk</TableHead>
                                    <TableHead className="text-right">Probability</TableHead>
                                    <TableHead className="text-right cursor-pointer hover:bg-slate-50" onClick={() => handleSort('weightedValue')}>
                                        <div className="flex items-center justify-end">
                                            Weighted Value {sortConfig?.key === 'weightedValue' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Est. End/Close</TableHead>
                                    <TableHead className="text-right">Edit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id} className="group">
                                        <TableCell className="sticky left-0 z-20 border-r bg-background font-medium group-hover:bg-muted/50">
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
                                            {item.client || <span className="text-muted-foreground">-</span>}
                                        </TableCell>
                                        <TableCell>
                                            {item.serviceArea || <span className="text-muted-foreground">-</span>}
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
                                        <TableCell className="text-center">
                                            {item.type === 'OPPORTUNITY' && typeof item.healthScore === 'number' ? (
                                                <HealthBadge score={item.healthScore} />
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.type === 'OPPORTUNITY' ? (
                                                <Badge variant="outline" className={`text-xs ${getRiskTone(item.riskScore)}`}>
                                                    <ShieldAlert className="h-3 w-3 mr-1" />
                                                    {formatRisk(item.riskScore)}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
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
                                        <TableCell className="text-right">
                                            <Link href={item.type === 'PROJECT' ? `/admin/project/${item.id}?edit=1` : `/admin/crm/${item.id}?edit=1`}>
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={13} className="text-center h-24 text-muted-foreground">
                                            No matching records found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    提示：可用 Shift + 滾輪水平移動；Name 欄已固定方便對齊。
                </div>
            </CardContent>
        </Card>
    );
}
