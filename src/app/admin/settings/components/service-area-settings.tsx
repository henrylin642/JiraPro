'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';
import { getServiceAreas, addServiceArea, deleteServiceArea, seedServiceAreas } from '../actions';

export function ServiceAreaSettings() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [areas, setAreas] = useState<any[]>([]);
    const [newArea, setNewArea] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
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
        } catch {
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
        } catch {
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
        } catch {
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
