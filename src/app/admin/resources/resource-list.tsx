'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { ResourceDialog } from './resource-dialog';
import { CreateResourceDialog } from './create-resource-dialog';
import { deleteResource } from './actions';

type Resource = {
    id: string;
    name: string;
    email: string;
    role: string;
    resourceProfile: {
        title: string | null;
        skills: string | null;
        costRate: any;
        billableRate: any;
        capacityHours: number;
    } | null;
};

export function ResourceList({ data }: { data: Resource[] }) {
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) return;

        setDeletingId(userId);
        try {
            const result = await deleteResource(userId);
            if (result.success) {
                // Success
            } else {
                alert(result.error || "Failed to delete resource");
            }
        } catch (error) {
            alert("An unexpected error occurred");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <CreateResourceDialog trigger={<Button>Add Resource</Button>} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Skills</TableHead>
                            <TableHead className="text-right">Cost/Hr</TableHead>
                            <TableHead className="text-right">Bill/Hr</TableHead>
                            <TableHead className="text-right">Capacity</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((resource) => (
                            <TableRow key={resource.id}>
                                <TableCell className="font-medium">
                                    <div>{resource.name}</div>
                                    <div className="text-xs text-muted-foreground">{resource.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{resource.role}</Badge>
                                </TableCell>
                                <TableCell>{resource.resourceProfile?.title || '-'}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                    {resource.resourceProfile?.skills ? (
                                        <div className="flex flex-wrap gap-1">
                                            {resource.resourceProfile.skills.split(',').slice(0, 3).map(s => (
                                                <Badge key={s} variant="secondary" className="text-[10px] px-1 py-0">{s.trim()}</Badge>
                                            ))}
                                            {resource.resourceProfile.skills.split(',').length > 3 && (
                                                <span className="text-xs text-muted-foreground">+{resource.resourceProfile.skills.split(',').length - 3}</span>
                                            )}
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    ${Number(resource.resourceProfile?.costRate || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    ${Number(resource.resourceProfile?.billableRate || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {resource.resourceProfile?.capacityHours || 40}h
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingResource(resource)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(resource.id)}
                                            disabled={!!deletingId}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            {deletingId === resource.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No resources found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {editingResource && (
                <ResourceDialog
                    open={!!editingResource}
                    onOpenChange={(open) => !open && setEditingResource(null)}
                    resource={editingResource}
                />
            )}
        </div>
    );
}
