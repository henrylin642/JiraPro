'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { backupSystem, restoreSystem } from '../actions';

export function DataManagementSettings() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        } catch {
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
        } catch {
            setMessage({ type: 'error', text: 'An unexpected error occurred during restoration.' });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                    Backup and restore your system data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
                        {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

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
    );
}
