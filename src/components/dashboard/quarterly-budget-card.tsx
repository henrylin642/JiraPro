'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CreditCard } from 'lucide-react';

interface QuarterlyBudgetCardProps {
    data: {
        name: string;
        project: number;
        opportunity: number;
    }[];
}

export function QuarterlyBudgetCard({ data }: QuarterlyBudgetCardProps) {
    const formatYAxis = (val: number) => {
        return `$${val / 1000}k`;
    };

    const formatTooltip = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const totalProject = data.reduce((acc, curr) => acc + curr.project, 0);
    const totalOpportunity = data.reduce((acc, curr) => acc + curr.opportunity, 0);
    const grandTotal = totalProject + totalOpportunity;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">2026 Budget Projection</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <div>
                        <div className="text-2xl font-bold">{formatTooltip(grandTotal)}</div>
                        <div className="text-sm text-muted-foreground">Total Projected</div>
                    </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatYAxis}
                                width={60}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                formatter={(value: any) => formatTooltip(Number(value || 0))}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="project" name="Projects" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="opportunity" name="Opportunities" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
