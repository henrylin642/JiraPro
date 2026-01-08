'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { backupSystem, restoreSystem, getExpenseCategories, addExpenseCategory, deleteExpenseCategory, changePassword, getBackupSettings, updateBackupSettings, getBackups, restoreFromBackupId } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Clock, History } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');

    React.useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const cats = await getExpenseCategories();
        setCategories(cats);
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setLoading(true);
        try {
            const result = await addExpenseCategory(newCategory.trim());
            if (result.success) {
                await loadCategories();
                setNewCategory('');
                setMessage({ type: 'success', text: 'Category added.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to add.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error adding category.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        setLoading(true);
        try {
            const result = await deleteExpenseCategory(id);
            if (result.success) {
                await loadCategories();
                setMessage({ type: 'success', text: 'Category deleted.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to delete.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error deleting category.' });
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await backupSystem();
            if (result.success && result.data) {
                // Trigger download
                const blob = new Blob([result.data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `jirapro_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setMessage({ type: 'success', text: 'Backup downloaded successfully.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Backup failed.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('WARNING: This will wipe all current data and replace it with the backup. Are you sure?')) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await restoreSystem(formData);
            if (result.success) {
                setMessage({ type: 'success', text: 'System restored successfully. Please refresh the page.' });
                // Optional: Force reload or redirect
                // window.location.reload(); 
            } else {
                setMessage({ type: 'error', text: result.error || 'Restore failed.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An unexpected error occurred during restoration.' });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new !== passwordData.confirm) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.new.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const result = await changePassword(passwordData.current, passwordData.new);
            if (result.success) {
                setMessage({ type: 'success', text: 'Password changed successfully' });
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            <div className="grid gap-6">
                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>
                            Update your password and security settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            {message && (
                                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
                                    {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                    <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                                    <AlertDescription>{message.text}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={passwordData.current}
                                    onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={passwordData.new}
                                    onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={passwordData.confirm}
                                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>
                            Backup and restore your system data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Remove duplicate message alert from here since it is global state now shared */}
                        {/*
                        {message && (
                            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
                                {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}
                        */}

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border rounded-lg bg-muted/10">
                            <div>
                                <h3 className="font-medium">Backup Data</h3>
                                <p className="text-sm text-muted-foreground">Download a full JSON snapshot of variables and database records.</p>
                            </div>
                            <Button onClick={handleBackup} disabled={loading} variant="outline" className="min-w-[140px]">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Download Backup
                            </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border rounded-lg bg-red-50/50 border-red-100">
                            <div>
                                <h3 className="font-medium text-red-900">Restore Data</h3>
                                <p className="text-sm text-red-700">Restore from a backup file. <span className="font-bold">This will replace all existing data.</span></p>
                            </div>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".json"
                                    onChange={handleFileChange}
                                />
                                <Button onClick={handleRestoreClick} disabled={loading} variant="destructive" className="min-w-[140px]">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Restore from File
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Expense Categories</CardTitle>
                        <CardDescription>
                            Manage the list of Accounting Subjects for Expenses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="New Category Name (e.g. Travel, Meals)"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                                <Button onClick={handleAddCategory} disabled={loading || !newCategory.trim()}>
                                    Add
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {categories.length === 0 && <span className="text-sm text-muted-foreground">No categories defined.</span>}
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center gap-2 bg-muted/50 pl-3 pr-1 py-1 rounded-full border">
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

                <BackupSettingsCard />

                <BackupSettingsCard />

                <ServiceAreaSettings />
            </div>
        </div>
    );
}

import { getServiceAreas, addServiceArea, deleteServiceArea, seedServiceAreas } from './actions';
import { MapPin } from 'lucide-react';

function ServiceAreaSettings() {
    const [areas, setAreas] = useState<any[]>([]);
    const [newArea, setNewArea] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        loadAreas();
    }, []);

    const loadAreas = async () => {
        const data = await getServiceAreas();
        setAreas(data);
    };

    const handleAdd = async () => {
        if (!newArea.trim()) return;
        setLoading(true);
        try {
            const result = await addServiceArea(newArea.trim());
            if (result.success) {
                await loadAreas();
                setNewArea('');
                setMessage({ type: 'success', text: 'Service area added.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to add.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error adding area.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        setLoading(true);
        try {
            const result = await deleteServiceArea(id);
            if (result.success) {
                await loadAreas();
                setMessage({ type: 'success', text: 'Service area deleted.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to delete.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error deleting area.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedServiceAreas();
            if (result.success) {
                await loadAreas();
                setMessage({ type: 'success', text: 'Taiwan cities added.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to seed.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error seeding areas.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Service Areas</CardTitle>
                <CardDescription>
                    Manage service locations for Projects and Opportunities.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {message && (
                        <div className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Input
                            placeholder="New Service Area (e.g. Taipei City)"
                            value={newArea}
                            onChange={(e) => setNewArea(e.target.value)}
                        />
                        <Button onClick={handleAdd} disabled={loading || !newArea.trim()}>
                            Add
                        </Button>
                        <Button variant="outline" onClick={handleSeed} disabled={loading}>
                            Seed Taiwan Cities
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {areas.length === 0 && <span className="text-sm text-muted-foreground">No service areas defined.</span>}
                        {areas.map(area => (
                            <div key={area.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 pl-3 pr-1 py-1 rounded-full border border-blue-100">
                                <MapPin className="h-3 w-3" />
                                <span className="text-sm font-medium">{area.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-blue-100"
                                    onClick={() => handleDelete(area.id)}
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

function BackupSettingsCard() {
    const [settings, setSettings] = useState<{ enabled: boolean, hour: number }>({ enabled: true, hour: 19 });
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [s, b] = await Promise.all([getBackupSettings(), getBackups()]);
        setSettings(s);
        setBackups(b);
    };

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        const result = await updateBackupSettings(checked, settings.hour);
        if (result.success) setSettings(prev => ({ ...prev, enabled: checked }));
        else setMessage({ type: 'error', text: 'Failed to update settings' });
        setLoading(false);
    };

    const handleTimeChange = async (val: string) => {
        const hour = parseInt(val);
        setLoading(true);
        const result = await updateBackupSettings(settings.enabled, hour);
        if (result.success) setSettings(prev => ({ ...prev, hour }));
        else setMessage({ type: 'error', text: 'Failed to update time' });
        setLoading(false);
    };

    const handleRestore = async (id: string) => {
        if (!confirm('This will overwrite current data. Continue?')) return;
        setLoading(true);
        setMessage(null);
        try {
            const result = await restoreFromBackupId(id);
            if (result.success) setMessage({ type: 'success', text: 'Restored successfully.' });
            else setMessage({ type: 'error', text: result.error || 'Restore failed' });
        } catch (e) {
            setMessage({ type: 'error', text: 'Restore error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Automated Backup</CardTitle>
                <CardDescription>Configure daily automated backups to Supabase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {message && (
                    <div className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex items-center justify-between pb-4 border-b">
                    <div className="space-y-1">
                        <h4 className="font-medium">Daily Backup</h4>
                        <p className="text-sm text-muted-foreground">Automatically backup system data once a day.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select
                            disabled={!settings.enabled || loading}
                            value={settings.hour.toString()}
                            onValueChange={handleTimeChange}
                        >
                            <SelectTrigger className="w-[120px]">
                                <Clock className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                        {i.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={handleToggle}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm">Recent Backups</h4>
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No backups found.</TableCell>
                                    </TableRow>
                                )}
                                {backups.map(b => (
                                    <TableRow key={b.id}>
                                        <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{(b.size / 1024).toFixed(1)} KB</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleRestore(b.id)} disabled={loading}>
                                                Restore
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

