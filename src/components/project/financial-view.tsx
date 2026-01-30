'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importExpenses, updateExpense, deleteExpense } from '@/app/admin/project/expense-actions';
import { addProjectBudgetLine, updateProjectBudgetLine, deleteProjectBudgetLine } from '@/app/admin/project/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FinancialViewProps {
    project: any;
    expenseCategories: any[];
}

export function FinancialView({ project, expenseCategories }: FinancialViewProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [budgetForm, setBudgetForm] = useState({
        category: '',
        subCategory: '',
        plannedAmount: ''
    });
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
    const [editingBudgetForm, setEditingBudgetForm] = useState({
        category: '',
        subCategory: '',
        plannedAmount: ''
    });

    // Form states for editing
    const [editForm, setEditForm] = useState({
        description: '',
        amount: '',
        date: '',
        category: '',
        incurredBy: ''
    });

    const openEditDialog = (expense: any) => {
        setEditingExpense(expense);
        setEditForm({
            description: expense.description,
            amount: String(expense.amount),
            date: new Date(expense.date).toISOString().split('T')[0],
            category: expense.category || 'General',
            incurredBy: expense.incurredBy || ''
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingExpense) return;
        setLoadingAction(true);
        try {
            const result = await updateExpense(editingExpense.id, {
                description: editForm.description,
                amount: Number(editForm.amount),
                date: new Date(editForm.date),
                category: editForm.category,
                incurredBy: editForm.incurredBy
            });

            if (result.success) {
                setMessage({ type: 'success', text: 'Expense updated successfully.' });
                setIsEditDialogOpen(false);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update expense.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoadingAction(false);
        }
    };

    const handleAddBudgetLine = async () => {
        if (!budgetForm.category.trim() || !budgetForm.plannedAmount) return;
        setLoadingAction(true);
        try {
            const result = await addProjectBudgetLine(project.id, {
                category: budgetForm.category.trim(),
                subCategory: budgetForm.subCategory.trim() || undefined,
                plannedAmount: Number(budgetForm.plannedAmount)
            });
            if (result.success) {
                setBudgetForm({ category: '', subCategory: '', plannedAmount: '' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to add budget line.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error adding budget line.' });
        } finally {
            setLoadingAction(false);
        }
    };

    const handleStartEditBudget = (line: any) => {
        setEditingBudgetId(line.id);
        setEditingBudgetForm({
            category: line.category,
            subCategory: line.subCategory || '',
            plannedAmount: String(line.plannedAmount ?? '')
        });
    };

    const handleSaveBudgetEdit = async () => {
        if (!editingBudgetId) return;
        setLoadingAction(true);
        try {
            const result = await updateProjectBudgetLine(editingBudgetId, {
                projectId: project.id,
                category: editingBudgetForm.category.trim(),
                subCategory: editingBudgetForm.subCategory.trim() || undefined,
                plannedAmount: Number(editingBudgetForm.plannedAmount)
            });
            if (result.success) {
                setEditingBudgetId(null);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update budget line.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error updating budget line.' });
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDeleteBudgetLine = async (id: string) => {
        if (!confirm('Delete this budget line?')) return;
        setLoadingAction(true);
        try {
            const result = await deleteProjectBudgetLine(id, project.id);
            if (!result.success) {
                setMessage({ type: 'error', text: result.error || 'Failed to delete budget line.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error deleting budget line.' });
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;

        setLoadingAction(true);
        try {
            const result = await deleteExpense(id);
            if (result.success) {
                setMessage({ type: 'success', text: 'Expense deleted successfully.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to delete expense.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoadingAction(false);
        }
    };

    // Group expenses by category
    const groupedExpenses = useMemo(() => {
        if (!project.expenses) return {};

        const groups: Record<string, { expenses: any[], total: number }> = {};

        project.expenses.forEach((e: any) => {
            const category = e.category || 'Uncategorized';
            if (!groups[category]) {
                groups[category] = { expenses: [], total: 0 };
            }
            groups[category].expenses.push(e);
            groups[category].total += Number(e.amount);
        });

        // Sort categories if needed, or keep insertion order / alpha
        return groups;
    }, [project.expenses]);

    // Group timesheets by user
    const personnelCosts = useMemo(() => {
        if (!project.tasks) return [];

        const userCosts: Record<string, { name: string, hours: number, cost: number }> = {};

        project.tasks.forEach((task: any) => {
            task.timesheets?.forEach((ts: any) => {
                const userId = ts.userId;
                const userName = ts.user?.name || 'Unknown User';

                if (!userCosts[userId]) {
                    userCosts[userId] = { name: userName, hours: 0, cost: 0 };
                }
                userCosts[userId].hours += Number(ts.hours);
                userCosts[userId].cost += (Number(ts.hours) * Number(ts.costRate));
            });
        });

        return Object.values(userCosts).sort((a, b) => b.cost - a.cost);
    }, [project.tasks]);

    // Calculate Estimated Labor Cost (from Gantt)
    const estimatedLaborCost = useMemo(() => {
        if (!project.tasks) return 0;
        return project.tasks.reduce((acc: number, task: any) => {
            const hours = Number(task.estimatedHours) || 0;
            const rate = Number(task.assignee?.resourceProfile?.costRate) || 0;
            return acc + (hours * rate);
        }, 0);
    }, [project.tasks]);

    const metrics = useMemo(() => {
        const budget = Number(project.budget) || 0;
        const milestoneRevenue = project.milestones?.reduce((acc: number, m: any) => acc + Number(m.amount), 0) || 0;

        // Labor Cost (Timesheets + Completed Tasks Fallback)
        let hardLaborCost = 0; // From actual timesheets
        let billableAmount = 0;
        let impliedLaborCost = 0; // From DONE tasks without timesheets

        project.tasks?.forEach((task: any) => {
            const hasTimesheets = task.timesheets && task.timesheets.length > 0;

            // 1. Timesheet Calculation
            if (hasTimesheets) {
                task.timesheets.forEach((ts: any) => {
                    hardLaborCost += (Number(ts.hours) * Number(ts.costRate));
                    billableAmount += (Number(ts.hours) * Number(ts.billableRate));
                });
            }
            // 2. Fallback: If DONE but no timesheets, use Estimate
            else if (task.status === 'DONE') {
                const hours = Number(task.estimatedHours) || 0;
                const rate = Number(task.assignee?.resourceProfile?.costRate) || 0;
                impliedLaborCost += (hours * rate);
            }
        });

        const totalLaborCost = hardLaborCost + impliedLaborCost;

        // Expense Cost
        const expenseCost = project.expenses?.reduce((acc: number, e: any) => acc + Number(e.amount), 0) || 0;

        // Total Actual Cost
        const actualCost = totalLaborCost + expenseCost;

        const totalRevenue = milestoneRevenue > 0 ? milestoneRevenue : billableAmount;
        const profit = totalRevenue - actualCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        const plannedRevenue = budget > 0 ? budget : milestoneRevenue;
        const plannedDirectCost = estimatedLaborCost;
        const plannedProfit = plannedRevenue - plannedDirectCost;
        const plannedMargin = plannedRevenue > 0 ? (plannedProfit / plannedRevenue) * 100 : 0;

        return {
            budget,
            milestoneRevenue,
            actualCost,
            timesheetCost: totalLaborCost, // Map total labor to this key for UI compatibility
            hardLaborCost,
            impliedLaborCost,
            expenseCost,
            profit,
            margin,
            totalRevenue,
            plannedRevenue,
            plannedDirectCost,
            plannedProfit,
            plannedMargin
        };
    }, [project, estimatedLaborCost]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    const monthlyBreakdown = useMemo(() => {
        const months = Array.from({ length: 12 }).map((_, idx) => ({
            month: idx + 1,
            revenue: 0,
            labor: 0,
            expenses: 0,
            totalCost: 0,
            grossProfit: 0,
            cumulativeRevenue: 0,
            cumulativeCost: 0,
            cumulativeProfit: 0
        }));

        const allDates = [
            ...(project.milestones || []).map((m: any) => m.dueDate).filter(Boolean),
            ...(project.expenses || []).map((e: any) => e.date).filter(Boolean),
            ...(project.tasks || []).flatMap((t: any) => t.timesheets?.map((ts: any) => ts.date) || []).filter(Boolean)
        ];

        const baseDate = allDates.length > 0 ? new Date(allDates[0]) : new Date();
        const year = baseDate.getFullYear();

        (project.milestones || []).forEach((m: any) => {
            if (!m.dueDate) return;
            const date = new Date(m.dueDate);
            if (date.getFullYear() !== year) return;
            months[date.getMonth()].revenue += Number(m.amount);
        });

        (project.expenses || []).forEach((e: any) => {
            if (!e.date) return;
            const date = new Date(e.date);
            if (date.getFullYear() !== year) return;
            months[date.getMonth()].expenses += Number(e.amount);
        });

        (project.tasks || []).forEach((task: any) => {
            task.timesheets?.forEach((ts: any) => {
                if (!ts.date) return;
                const date = new Date(ts.date);
                if (date.getFullYear() !== year) return;
                months[date.getMonth()].labor += Number(ts.hours) * Number(ts.costRate);
            });
        });

        let cumulativeRevenue = 0;
        let cumulativeCost = 0;
        let cumulativeProfit = 0;
        months.forEach((m) => {
            m.totalCost = m.labor + m.expenses;
            m.grossProfit = m.revenue - m.totalCost;
            cumulativeRevenue += m.revenue;
            cumulativeCost += m.totalCost;
            cumulativeProfit += m.grossProfit;
            m.cumulativeRevenue = cumulativeRevenue;
            m.cumulativeCost = cumulativeCost;
            m.cumulativeProfit = cumulativeProfit;
        });

        return { year, months };
    }, [project]);

    const budgetStatus = useMemo(() => {
        const budgets = (project.budgetLines || []) as { id: string; category: string; subCategory?: string | null; plannedAmount: number }[];
        const actualByCategory: Record<string, number> = {};

        (project.expenses || []).forEach((e: any) => {
            const key = e.category || 'General';
            actualByCategory[key] = (actualByCategory[key] || 0) + Number(e.amount);
        });

        const items = budgets.map((line) => {
            const label = line.subCategory || line.category;
            const actual = actualByCategory[label] || 0;
            const remaining = Number(line.plannedAmount) - actual;
            const usage = Number(line.plannedAmount) > 0 ? (actual / Number(line.plannedAmount)) * 100 : 0;
            return {
                id: line.id,
                category: line.subCategory || line.category,
                baseCategory: line.category,
                subCategory: line.subCategory,
                planned: Number(line.plannedAmount),
                actual,
                remaining,
                usage
            };
        });

        return items.sort((a, b) => b.usage - a.usage);
    }, [project]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await importExpenses(project.id, formData);
            if (result.success) {
                setMessage({ type: 'success', text: `Successfully imported ${result.count} expenses.` });
            } else {
                setMessage({ type: 'error', text: result.error || 'Import failed.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {metrics.expenseCost > 0 && (
                <Alert className="bg-blue-50 border-blue-200">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Expenses Included</AlertTitle>
                    <AlertDescription>
                        Actual Cost includes ${metrics.expenseCost.toLocaleString()} expenses, ${(metrics as any).hardLaborCost?.toLocaleString() || 0} from timesheets, and ${(metrics as any).impliedLaborCost?.toLocaleString() || 0} from completed tasks.
                    </AlertDescription>
                </Alert>
            )}
            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
                    <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}


            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.budget)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.actualCost)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(metrics.profit)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Margin</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${metrics.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metrics.margin.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Setup */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cost Budget Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <Select
                                value={budgetForm.category}
                                onValueChange={(value) => setBudgetForm({ ...budgetForm, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseCategories.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                            {cat.code ? `${cat.code} - ${cat.name}` : cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Sub Category (optional)"
                                value={budgetForm.subCategory}
                                onChange={(e) => setBudgetForm({ ...budgetForm, subCategory: e.target.value })}
                            />
                            <Input
                                type="number"
                                placeholder="Planned Amount"
                                value={budgetForm.plannedAmount}
                                onChange={(e) => setBudgetForm({ ...budgetForm, plannedAmount: e.target.value })}
                            />
                            <Button onClick={handleAddBudgetLine} disabled={loadingAction || !budgetForm.category || !budgetForm.plannedAmount}>
                                Add Budget
                            </Button>
                        </div>

                        {(project.budgetLines || []).length === 0 ? (
                            <div className="text-sm text-muted-foreground">No budget lines defined yet.</div>
                        ) : (
                            <div className="rounded-md border">
                                <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_120px] gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30">
                                    <span>Category</span>
                                    <span>Sub</span>
                                    <span className="text-right">Planned</span>
                                    <span className="text-right">Actual</span>
                                    <span className="text-right">Remaining</span>
                                    <span className="text-right">Actions</span>
                                </div>
                                <div className="divide-y">
                                    {budgetStatus.map((line) => (
                                        <div key={line.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_120px] gap-2 px-3 py-2 text-sm items-center">
                                            <span>{line.baseCategory}</span>
                                            <span className="text-muted-foreground">{line.subCategory || '-'}</span>
                                            <span className="text-right">{formatCurrency(line.planned)}</span>
                                            <span className="text-right text-red-600">{formatCurrency(line.actual)}</span>
                                            <span className={`text-right ${line.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(line.remaining)}
                                            </span>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleStartEditBudget({ id: line.id, category: line.baseCategory, subCategory: line.subCategory, plannedAmount: line.planned })}>
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteBudgetLine(line.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Monthly Cashflow */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Cashflow ({monthlyBreakdown.year})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] bg-muted/40 text-xs font-semibold text-muted-foreground px-3 py-2">
                                <span>Month</span>
                                <span className="text-right">Revenue</span>
                                <span className="text-right">Cost</span>
                                <span className="text-right">Gross Profit</span>
                                <span className="text-right">Cumulative</span>
                            </div>
                            <div className="divide-y">
                                {monthlyBreakdown.months.map((m) => (
                                    <div key={m.month} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] px-3 py-2 text-sm">
                                        <span>{m.month}月</span>
                                        <span className="text-right">{formatCurrency(m.revenue)}</span>
                                        <span className="text-right">{formatCurrency(m.totalCost)}</span>
                                        <span className={`text-right ${m.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(m.grossProfit)}
                                        </span>
                                        <span className="text-right text-muted-foreground">{formatCurrency(m.cumulativeProfit)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personnel Costs (Timesheets) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            Personnel Development Costs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {personnelCosts.length === 0 ? (
                            <div className="text-muted-foreground text-sm py-4 text-center">No timesheets recorded yet.</div>
                        ) : (
                            <ScrollArea className="h-[250px] w-full rounded-md border">
                                <div className="p-4 space-y-3">
                                    {personnelCosts.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-medium text-sm">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {p.hours.toFixed(1)} hrs
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-amber-700">
                                                ${p.cost.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                        <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                            <span className="font-medium text-muted-foreground">Total Labor Cost (Actual)</span>
                            <span className="font-bold text-amber-700">${metrics.timesheetCost.toLocaleString()}</span>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="font-medium text-muted-foreground">Estimated Labor Cost (Planned)</span>
                            <span className="font-bold text-blue-600">${estimatedLaborCost.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses Import & List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Other Expenses</CardTitle>
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <Button size="sm" variant="outline" onClick={handleImportClick} disabled={uploading}>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import Excel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(!project.expenses || project.expenses.length === 0) ? (
                            <div className="text-muted-foreground text-sm py-4 text-center">No expenses imported. Upload an Excel file to add costs.</div>
                        ) : (
                            <ScrollArea className="h-[400px] w-full rounded-md border">
                                <div className="space-y-6 p-4">
                                    {Object.entries(groupedExpenses).sort((a, b) => a[0].localeCompare(b[0])).map(([category, group]: [string, any]) => (
                                        <div key={category} className="space-y-2">
                                            <div className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded-md">
                                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{category}</h4>
                                                <div className="font-bold text-sm text-muted-foreground">
                                                    Subtotal: ${group.total.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="pl-2 space-y-1">
                                                {group.expenses.map((e: any) => (
                                                    <div key={e.id} className="flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-muted/10 p-2 rounded transition-colors">
                                                        <div>
                                                            <div className="font-medium text-sm">{e.description}</div>
                                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                                <span suppressHydrationWarning>{new Date(e.date).toLocaleDateString()}</span>
                                                                {e.incurredBy && <span>• {e.incurredBy}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="font-bold text-red-600 w-24 text-right">
                                                                -${Number(e.amount).toLocaleString()}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(e)}>
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => handleDelete(e.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                            <DialogDescription>Modify expense details and assign an accounting subject.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Input
                                    id="description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Subject</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={editForm.category}
                                        onValueChange={(val) => setEditForm({ ...editForm, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select accounting subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="General">General</SelectItem>
                                            {expenseCategories && expenseCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    {cat.code ? `${cat.code} - ${cat.name}` : cat.name}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="Travel">Travel</SelectItem>
                                            <SelectItem value="Software">Software</SelectItem>
                                            <SelectItem value="Hardware">Hardware</SelectItem>
                                            <SelectItem value="Meals">Meals</SelectItem>
                                            <SelectItem value="Services">Services</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {(() => {
                                        const match = budgetStatus.find((b) => b.category === editForm.category);
                                        if (!match) return null;
                                        return (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                剩餘預算：{formatCurrency(match.remaining)}（使用率 {match.usage.toFixed(1)}%）
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="incurredBy" className="text-right">Incurred By</Label>
                                <Input
                                    id="incurredBy"
                                    value={editForm.incurredBy}
                                    onChange={(e) => setEditForm({ ...editForm, incurredBy: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveEdit} disabled={loadingAction}>
                                {loadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!editingBudgetId} onOpenChange={(open) => !open && setEditingBudgetId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Budget Line</DialogTitle>
                            <DialogDescription>Update planned cost budget for this project.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Category</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={editingBudgetForm.category}
                                        onValueChange={(val) => setEditingBudgetForm({ ...editingBudgetForm, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {expenseCategories.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    {cat.code ? `${cat.code} - ${cat.name}` : cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Sub Category</Label>
                                <Input
                                    className="col-span-3"
                                    value={editingBudgetForm.subCategory}
                                    onChange={(e) => setEditingBudgetForm({ ...editingBudgetForm, subCategory: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Planned</Label>
                                <Input
                                    className="col-span-3"
                                    type="number"
                                    value={editingBudgetForm.plannedAmount}
                                    onChange={(e) => setEditingBudgetForm({ ...editingBudgetForm, plannedAmount: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingBudgetId(null)}>Cancel</Button>
                            <Button onClick={handleSaveBudgetEdit} disabled={loadingAction}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Milestones (Existing) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Milestones Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(!project.milestones || project.milestones.length === 0) ? (
                            <div className="text-muted-foreground text-sm">No milestones defined.</div>
                        ) : (
                            <div className="space-y-4">
                                {project.milestones.map((m: any) => (
                                    <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div>
                                            <div className="font-medium">{m.name}</div>
                                            <div className="text-xs text-muted-foreground">Due: <span suppressHydrationWarning>{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}</span></div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">${Number(m.amount).toLocaleString()}</div>
                                            <div className={`text-xs ${m.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                                                {m.isPaid ? 'Paid' : 'Unpaid'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div >
        </div >
    );
}
