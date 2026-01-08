'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject, updateProject, getProjectFormData } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';

interface ProjectDialogProps {
    project?: any; // If provided, edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    accounts?: { id: string, name: string }[];
    users?: { id: string, name: string }[];
    serviceAreas?: { id: string, name: string }[];
}

export function ProjectDialog({ project, trigger, open, onOpenChange, accounts = [], users = [], serviceAreas = [] }: ProjectDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        accountId: '',
        managerId: '',
        status: 'ACTIVE',
        startDate: '',
        endDate: '',
        budget: '',
        description: '',
        serviceAreaId: ''
    });

    // Handle Open State
    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen);
        if (onOpenChange) onOpenChange(newOpen);
    };

    useEffect(() => {
        const isDialogOpen = open !== undefined ? open : isOpen;
        if (isDialogOpen) {
            if (project) {
                setFormData({
                    name: project.name || '',
                    code: project.code || '',
                    accountId: project.accountId || '',
                    managerId: project.managerId || '',
                    status: project.status || 'ACTIVE',
                    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                    budget: project.budget ? String(project.budget) : '',
                    description: project.description || '',
                    serviceAreaId: project.serviceAreaId || ''
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    accountId: '',
                    managerId: '',
                    status: 'ACTIVE',
                    startDate: '',
                    endDate: '',
                    budget: '',
                    description: '',
                    serviceAreaId: ''
                });
            }
        }
    }, [project, open, isOpen]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            startDate: formData.startDate ? new Date(formData.startDate) : undefined,
            endDate: formData.endDate ? new Date(formData.endDate) : undefined,
            budget: formData.budget ? Number(formData.budget) : 0,
            accountId: formData.accountId === 'none' || !formData.accountId ? undefined : formData.accountId,
            managerId: formData.managerId === 'none' || !formData.managerId ? undefined : formData.managerId,
            serviceAreaId: formData.serviceAreaId === 'none' || !formData.serviceAreaId ? undefined : formData.serviceAreaId
        };

        try {
            let result;
            if (project) {
                result = await updateProject(project.id, payload);
            } else {
                result = await createProject(payload);
            }

            if (result.success) {
                handleOpenChange(false);
                router.refresh();
            } else {
                alert(`Error: ${result.error || 'Operation failed'}`);
            }
        } catch (error) {
            console.error(error);
            alert("An unexpected error occurred");
        }
    };

    return (
        <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Project Name</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Project Code</Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder={project ? "" : "Auto-generated"}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Account</Label>
                            <Select
                                value={formData.accountId}
                                onValueChange={v => setFormData({ ...formData, accountId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {accounts.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Manager</Label>
                            <Select
                                value={formData.managerId}
                                onValueChange={v => setFormData({ ...formData, managerId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {users.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Service Area</Label>
                        <Select
                            value={formData.serviceAreaId}
                            onValueChange={v => setFormData({ ...formData, serviceAreaId: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Service Area" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {serviceAreas.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Budget</Label>
                            <Input
                                type="number"
                                value={formData.budget}
                                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={v => setFormData({ ...formData, status: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="PLANNING">Planning</SelectItem>
                                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
