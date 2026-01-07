'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProjectFromOpportunity } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';
import { Briefcase } from 'lucide-react';

export function ConvertToProjectDialog({ opportunityId, opportunityTitle }: { opportunityId: string, opportunityTitle: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: opportunityTitle,
        code: `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        managerId: '', // Ideally this would be a select from users
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // For now, we'll just use a hardcoded manager ID or let the backend handle it if optional,
            // but the schema likely requires it. In a real app, we'd fetch users.
            // Let's assume the user will input a valid ID or we pick one for demo.
            // Actually, let's fetch users in the parent component or just use a placeholder for now.
            // Since we don't have a user picker yet, let's just try to submit.
            // Wait, managerId is required in schema? Let's check schema.
            // Schema: manager User @relation... managerId String
            // So we need a valid User ID.
            // For the demo, I'll hardcode the 'Bob PM' ID if I can find it, or just ask the user to input it (not ideal).
            // Better: Let's just use the first user found in the action if not provided, or make the action fetch a default PM.
            // For this UI, let's just let the user type it, or better, we'll fetch users in the action if empty.
            // Actually, let's just pass what we have.

            // To make this robust without a user picker, I'll modify the action to pick a default manager if not provided.

            await createProjectFromOpportunity(
                opportunityId,
                formData.name,
                formData.code,
                formData.managerId, // This might fail if empty
                new Date(formData.startDate),
                new Date(formData.endDate)
            );
            setOpen(false);
            router.push('/admin/project');
        } catch (error) {
            console.error(error);
            alert('Failed to create project. Please ensure Manager ID is valid.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Convert to Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Convert to Project</DialogTitle>
                    <DialogDescription>
                        Create a new project from this opportunity. The opportunity stage will be updated to Closed Won.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">
                                Code
                            </Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startDate" className="text-right">
                                Start
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="endDate" className="text-right">
                                End
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="managerId" className="text-right">
                                Manager ID
                            </Label>
                            <Input
                                id="managerId"
                                placeholder="User ID for PM"
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                className="col-span-3"
                            />
                            <div className="col-span-4 text-xs text-muted-foreground text-right">
                                (Temporary: Enter a valid User ID)
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
