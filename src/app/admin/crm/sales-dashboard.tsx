'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SalesStats } from './dashboard-actions';
import { DollarSign, TrendingUp, Filter, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SalesDashboard({ stats }: { stats: SalesStats }) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    const maxCount = Math.max(...stats.funnel.map(f => f.count));

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                        <p className="text-xs text-muted-foreground">Total Active Opportunities</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weighted Forecast</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.weightedValue)}</div>
                        <p className="text-xs text-muted-foreground">Adjusted by Probability</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Closed Won / Total Closed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCount}</div>
                        <p className="text-xs text-muted-foreground">Active in Pipeline</p>
                    </CardContent>
                </Card>
            </div>

            {/* Funnel Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle>Sales Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.funnel.map((stage) => (
                            <div key={stage.stage} className="grid grid-cols-[150px_1fr_150px] gap-4 items-center">
                                <div className="text-sm font-medium text-right capitalize">
                                    {stage.stage.replace('_', ' ')}
                                </div>
                                <div className="h-8 bg-muted rounded-full overflow-hidden relative">
                                    {stage.count > 0 && (
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                stage.stage === 'CLOSED_WON' ? "bg-green-500" :
                                                    stage.stage === 'NEGOTIATION' ? "bg-blue-500" :
                                                        stage.stage === 'PROPOSAL' ? "bg-indigo-500" :
                                                            "bg-slate-400"
                                            )}
                                            style={{ width: `${(stage.count / maxCount) * 100}%` }}
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-start pl-3 text-xs font-medium text-white mix-blend-difference pointer-events-none">
                                        {stage.count} Opps
                                    </div>
                                </div>
                                <div className="text-sm font-mono text-muted-foreground">
                                    {formatCurrency(stage.value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
