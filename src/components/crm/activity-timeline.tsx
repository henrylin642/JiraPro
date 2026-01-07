'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createInteraction, updateInteraction, deleteInteraction } from '@/app/admin/crm/actions';
import { format } from 'date-fns';
import { CalendarIcon, Mail, MessageSquare, Phone, User, MoreVertical, Pencil, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
    id: string;
    name: string;
    avatarUrl: string | null;
};

type Interaction = {
    id: string;
    type: string;
    notes: string | null;
    date: Date;
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
};

export function ActivityTimeline({
    opportunityId,
    accountId,
    interactions,
    users
}: {
    opportunityId: string;
    accountId: string;
    interactions: Interaction[];
    users: User[];
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: 'NOTE',
        notes: '',
        userId: users[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
    });

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            type: 'NOTE',
            notes: '',
            userId: users[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
        });
    };

    const handleEdit = (interaction: Interaction) => {
        setEditingId(interaction.id);
        const dateStr = new Date(interaction.date).toISOString().split('T')[0];
        setFormData({
            type: interaction.type,
            notes: interaction.notes || '',
            userId: interaction.user.id,
            date: dateStr,
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this activity?')) return;
        try {
            await deleteInteraction(id, opportunityId);
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingId) {
                await updateInteraction(editingId, {
                    type: formData.type,
                    notes: formData.notes,
                    userId: formData.userId,
                    date: new Date(formData.date),
                    opportunityId: opportunityId
                });
                setEditingId(null);
            } else {
                await createInteraction({
                    opportunityId,
                    accountId,
                    type: formData.type,
                    notes: formData.notes,
                    userId: formData.userId,
                    date: new Date(formData.date),
                });
            }
            // Reset form
            setFormData(prev => ({ ...prev, notes: '' }));
            if (editingId) resetForm();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CALL': return <Phone className="h-4 w-4" />;
            case 'EMAIL': return <Mail className="h-4 w-4" />;
            case 'MEETING': return <User className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        {editingId ? 'Edit Activity' : 'Log Activity'}
                        {editingId && (
                            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NOTE">Note</SelectItem>
                                        <SelectItem value="CALL">Call</SelectItem>
                                        <SelectItem value="EMAIL">Email</SelectItem>
                                        <SelectItem value="MEETING">Meeting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Logged By</label>
                            <Select
                                value={formData.userId}
                                onValueChange={(val) => setFormData({ ...formData, userId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select User" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <Textarea
                                placeholder="Details about the interaction..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting || !formData.userId}>
                            {isSubmitting ? 'Saving...' : (editingId ? 'Update Activity' : 'Log Activity')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Right Column: Timeline */}
            <Card className="h-full max-h-[600px] overflow-hidden flex flex-col">
                <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pr-2">
                    <div className="space-y-6">
                        {interactions.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center py-4">No activities logged yet.</p>
                        )}
                        {interactions.map((item) => (
                            <div key={item.id} className="relative pl-6 pb-2 border-l border-border last:border-0 ml-2 group">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[21px] top-1 h-8 w-8 rounded-full border bg-background flex items-center justify-center">
                                    {getIcon(item.type)}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">{item.type}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy')}</span>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                        <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                                                        <Trash className="mr-2 h-3.5 w-3.5 text-destructive/70" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.notes}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={item.user.avatarUrl || ''} />
                                            <AvatarFallback className="text-[9px]">{item.user.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground">Logged by {item.user.name}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
