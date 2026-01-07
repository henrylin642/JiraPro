import React from 'react';
import { getFinancialSummary } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
    const { summary, projects } = await getFinancialSummary();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Financial Intelligence</h2>
                <p className="text-muted-foreground">Real-time visibility into project profitability and margins.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Budget)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.budget)}</div>
                        <p className="text-xs text-muted-foreground">Across {projects.length} projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.actualCost)}</div>
                        <p className="text-xs text-muted-foreground">Labor & Materials</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
                        {summary.margin >= 0 ?
                            <TrendingUp className="h-4 w-4 text-green-500" /> :
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        }
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", summary.margin < 0 ? "text-red-500" : "text-green-600")}>
                            {formatCurrency(summary.margin)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.marginPercent.toFixed(1)}% Profitability
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.invoiced)}</div>
                        <p className="text-xs text-muted-foreground">
                            {((summary.invoiced / summary.budget) * 100).toFixed(0)}% of Budget
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Profitability Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Profitability</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead className="text-right">Budget</TableHead>
                                <TableHead className="text-right">Actual Cost</TableHead>
                                <TableHead className="text-right">Margin ($)</TableHead>
                                <TableHead className="text-right">Margin (%)</TableHead>
                                <TableHead className="w-[200px]">Health</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="font-medium">{p.name}</div>
                                        <div className="text-xs text-muted-foreground">{p.code}</div>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(p.financials.budget)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(p.financials.actualCost)}</TableCell>
                                    <TableCell className={cn("text-right font-medium", p.financials.margin < 0 ? "text-red-600" : "text-green-600")}>
                                        {formatCurrency(p.financials.margin)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {p.financials.marginPercent.toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                        <Progress
                                            value={Math.max(0, p.financials.marginPercent)}
                                            className={cn(
                                                "h-2",
                                                p.financials.marginPercent < 20 ? "bg-red-100 [&>div]:bg-red-500" :
                                                    p.financials.marginPercent < 50 ? "bg-yellow-100 [&>div]:bg-yellow-500" :
                                                        "bg-green-100 [&>div]:bg-green-500"
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {projects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No active projects found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
