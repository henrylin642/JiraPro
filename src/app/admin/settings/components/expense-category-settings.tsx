'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileDown, FileUp, Trash2 } from 'lucide-react';
import { getExpenseCategories, addExpenseCategory, deleteExpenseCategory, exportExpenseCategoriesCsv, importExpenseCategories } from '../actions';

export function ExpenseCategorySettings() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryCode, setNewCategoryCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const cats = await getExpenseCategories();
        setCategories(cats);
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setLoading(true);
        setMessage(null);
        try {
            const result = await addExpenseCategory(newCategory.trim(), newCategoryCode.trim() || undefined);
            if (result.success) {
                await loadCategories();
                setNewCategory('');
                setNewCategoryCode('');
                setMessage({ type: 'success', text: 'Category added.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to add.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Error adding category.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await deleteExpenseCategory(id);
            if (result.success) {
                await loadCategories();
                setMessage({ type: 'success', text: 'Category deleted.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to delete.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Error deleting category.' });
        } finally {
            setLoading(false);
        }
    };

    const handleExportCategories = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await exportExpenseCategoriesCsv();
            if (result.success && result.csv) {
                const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `expense_categories_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setMessage({ type: 'success', text: 'Categories exported.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Export failed.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Export error.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImportCategories = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await importExpenseCategories(formData);
            if (result.success) {
                await loadCategories();
                setMessage({ type: 'success', text: `Imported: ${result.created}, updated: ${result.updated}.` });
            } else {
                setMessage({ type: 'error', text: result.error || 'Import failed.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Import error.' });
        } finally {
            setLoading(false);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>
                    Manage the list of Accounting Subjects for Expenses.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {message && (
                        <div className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            placeholder="Category Code (optional)"
                            value={newCategoryCode}
                            onChange={(e) => setNewCategoryCode(e.target.value)}
                            className="sm:w-48"
                        />
                        <Input
                            placeholder="New Category Name (e.g. Travel, Meals)"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button onClick={handleAddCategory} disabled={loading || !newCategory.trim()}>
                            Add
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleExportCategories} disabled={loading}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                            <label className="inline-flex items-center">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={handleImportCategories}
                                />
                                <Button asChild variant="outline" disabled={loading}>
                                    <span>
                                        <FileUp className="mr-2 h-4 w-4" />
                                        Import CSV
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {categories.length === 0 && <span className="text-sm text-muted-foreground">No categories defined.</span>}
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 bg-muted/50 pl-3 pr-1 py-1 rounded-full border">
                                <span className="text-xs text-muted-foreground">{cat.code || '-'}</span>
                                <span className="text-sm font-medium">{cat.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
