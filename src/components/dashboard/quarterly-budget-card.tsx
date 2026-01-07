import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CreditCard } from 'lucide-react';

interface QuarterlyBudgetCardProps {
    data: {
        Q1: number;
        Q2: number;
        Q3: number;
        Q4: number;
    };
}

export function QuarterlyBudgetCard({ data }: QuarterlyBudgetCardProps) {
    const chartData = [
        { name: 'Q1', value: data.Q1 },
        { name: 'Q2', value: data.Q2 },
        { name: 'Q3', value: data.Q3 },
        { name: 'Q4', value: data.Q4 },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
        }).format(val);
    };

    const total = data.Q1 + data.Q2 + data.Q3 + data.Q4;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">2026 Budget Distribution</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-4">{formatCurrency(total)} <span className="text-sm font-normal text-muted-foreground">Total</span></div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
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
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Budget']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1'][index]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
