'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, History } from 'lucide-react';
import { getBackupSettings, updateBackupSettings, getBackups, restoreFromBackupId } from '../actions';

export function BackupSettingsCard() {
    const [settings, setSettings] = useState<{ enabled: boolean, hour: number }>({ enabled: true, hour: 19 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
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
        } catch {
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
