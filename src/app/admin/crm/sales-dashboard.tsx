'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SalesStats } from './dashboard-actions';
import { DollarSign, TrendingUp, Filter, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE_LABELS } from '@/lib/crm-constants';

type HealthSummary = {
    totalActive: number;
    healthy: number;
    watch: number;
    atRisk: number;
    risks: {
        noRecentActivity: number;
        noNextStep: number;
        closeDateOverdue: number;
    };
};

type HighRiskDeal = {
    id: string;
    title: string;
    accountName: string;
    ownerName: string;
    stage: string;
    estimatedValue: number;
    healthScore: number;
};

export function SalesDashboard({
    stats,
    healthSummary,
    highRiskDeals,
}: {
    stats: SalesStats;
    healthSummary: HealthSummary;
    highRiskDeals: HighRiskDeal[];
}) {
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

            <Card>
                <CardHeader>
                    <CardTitle>Deal Health Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border p-4">
                            <div className="text-xs uppercase text-muted-foreground tracking-wide">Healthy</div>
                            <div className="text-2xl font-bold text-emerald-600">{healthSummary.healthy}</div>
                            <div className="text-xs text-muted-foreground">of {healthSummary.totalActive} active deals</div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="text-xs uppercase text-muted-foreground tracking-wide">Watch</div>
                            <div className="text-2xl font-bold text-amber-600">{healthSummary.watch}</div>
                            <div className="text-xs text-muted-foreground">needs review</div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="text-xs uppercase text-muted-foreground tracking-wide">At Risk</div>
                            <div className="text-2xl font-bold text-rose-600">{healthSummary.atRisk}</div>
                            <div className="text-xs text-muted-foreground">high attention</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                            <span className="text-muted-foreground">No recent activity</span>
                            <Badge variant="outline">{healthSummary.risks.noRecentActivity}</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                            <span className="text-muted-foreground">No next step</span>
                            <Badge variant="outline">{healthSummary.risks.noNextStep}</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                            <span className="text-muted-foreground">Close date overdue</span>
                            <Badge variant="outline">{healthSummary.risks.closeDateOverdue}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>High Value, Low Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {highRiskDeals.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No high-risk, high-value deals.</div>
                    ) : (
                        highRiskDeals.map((deal) => (
                            <div key={deal.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-1">
                                    <Link href={`/admin/crm/${deal.id}`} className="font-semibold hover:underline">
                                        {deal.title}
                                    </Link>
                                    <div className="text-xs text-muted-foreground">
                                        {deal.accountName} · {deal.ownerName}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Badge variant="outline" className="text-xs">{STAGE_LABELS[deal.stage] || deal.stage}</Badge>
                                    <Badge variant="outline" className="text-xs">Health {deal.healthScore}</Badge>
                                    <span className="font-mono text-green-600">{formatCurrency(deal.estimatedValue)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

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
                                    {STAGE_LABELS[stage.stage] || stage.stage}
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
        </div >
    );
}
