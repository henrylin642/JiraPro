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
import { Briefcase, Target } from 'lucide-react';

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
};

export function PortfolioTable({ data }: { data: PortfolioItem[] }) {

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Master Portfolio (Projects & Opportunities)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                                <TableHead className="text-right">Probability</TableHead>
                                <TableHead className="text-right">Weighted Value</TableHead>
                                <TableHead className="text-right">Est. End/Close</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
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
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No active projects or opportunities found.
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
