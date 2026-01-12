
import React from 'react';
import { getExecutiveStats, getPortfolio } from './dashboard-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    Briefcase,
    Users,
    Activity,
    AlertTriangle,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PortfolioTable } from '@/components/dashboard/portfolio-table';
import { QuarterlyBudgetCard } from '@/components/dashboard/quarterly-budget-card';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const [stats, portfolio] = await Promise.all([
        getExecutiveStats(),
        getPortfolio()
    ]);
    const { finance, projectStats, resourceStats, recentMilestones, quarterlyBudgets2026 } = stats;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="p-6 space-y-6">
            {/* ... Existing Headers and KPIS ... */}

            {/* Top KPI Cards (Keep existing) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Revenue (Budget)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(finance.budget)}</div>
                        <p className={cn("text-xs font-medium", finance.margin >= 0 ? "text-green-600" : "text-red-600")}>
                            {finance.marginPercent.toFixed(1)}% Projected Margin
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projectStats.active}</div>
                        <p className="text-xs text-muted-foreground">
                            {projectStats.total} Total Projects
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resourceStats.utilizationRate.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {resourceStats.activeCount} / {resourceStats.totalResources} Active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projects At Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{projectStats.atRisk}</div>
                        <p className="text-xs text-muted-foreground">Low Margin ({'<'}20%)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Portfolio Table - Replaces previous sections for better overview */}
            <PortfolioTable data={portfolio} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Project Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium">Active</span>
                                </div>
                                <span className="font-bold">{projectStats.active}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                                    <span className="text-sm font-medium">Planning</span>
                                </div>
                                <span className="font-bold">{projectStats.planning}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                    <span className="text-sm font-medium">Completed</span>
                                </div>
                                <span className="font-bold">{projectStats.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                    <span className="text-sm font-medium">On Hold</span>
                                </div>
                                <span className="font-bold">{projectStats.onHold}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2026 Quarterly Budget Distribution */}
                <QuarterlyBudgetCard data={quarterlyBudgets2026} />

                {/* Upcoming Milestones */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Billing Milestones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentMilestones.map(m => (
                                <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <div className="font-medium text-sm">{m.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" /> {m.project.name}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-medium text-sm">{formatCurrency(m.amount)}</div>
                                        <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'TBD'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentMilestones.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No pending milestones found.
                                </div>
                            )}
                            <div className="pt-2">
                                <Link href="/admin/finance" className="text-xs text-blue-600 hover:underline">
                                    View Financial Dashboard &rarr;
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
