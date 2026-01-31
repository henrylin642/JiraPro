'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { createProject, updateProject } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { formatNumberInput, stripNumberFormatting } from '@/lib/format';

interface ProjectSheetProps {
    project?: any; // If provided, edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    accounts?: { id: string, name: string }[];
    users?: { id: string, name: string }[];
    serviceAreas?: { id: string, name: string }[];
}

export function ProjectSheet({ project, trigger, open, defaultOpen, onOpenChange, accounts = [], users = [], serviceAreas = [] }: ProjectSheetProps) {
    const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
    const [isLoading, setIsLoading] = useState(false);
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
        if (defaultOpen && open === undefined) {
            setIsOpen(true);
        }
    }, [defaultOpen, open]);

    useEffect(() => {
        const isSheetOpen = open !== undefined ? open : isOpen;
        if (isSheetOpen) {
            if (project) {
                setFormData({
                    name: project.name || '',
                    code: project.code || '',
                    accountId: project.accountId || '',
                    managerId: project.managerId || '',
                    status: project.status || 'ACTIVE',
                    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                    budget: project.budget ? formatNumberInput(String(project.budget)) : '',
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
        setIsLoading(true);

        const payload = {
            ...formData,
            startDate: formData.startDate ? new Date(formData.startDate) : undefined,
            endDate: formData.endDate ? new Date(formData.endDate) : undefined,
            budget: formData.budget ? Number(stripNumberFormatting(formData.budget)) : 0,
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
            {trigger ? (
                <SheetTrigger asChild>{trigger}</SheetTrigger>
            ) : !project ? (
                <SheetTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                    </Button>
                </SheetTrigger>
            ) : null}
            <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
                <SheetHeader>
                    <SheetTitle>{project ? 'Edit Project Details' : 'New Project'}</SheetTitle>
                    <SheetDescription>
                        {project ? 'Make changes to your project here. Click save when you\'re done.' : 'Enter details for the new project.'}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Project Code</Label>
                                <Input
                                    id="code"
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
                                <Label htmlFor="account">Client / Account</Label>
                                <Select
                                    value={formData.accountId}
                                    onValueChange={v => setFormData({ ...formData, accountId: v })}
                                >
                                    <SelectTrigger id="account">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Internal)</SelectItem>
                                        {accounts.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manager">Project Manager</Label>
                                <Select
                                    value={formData.managerId}
                                    onValueChange={v => setFormData({ ...formData, managerId: v })}
                                >
                                    <SelectTrigger id="manager">
                                        <SelectValue placeholder="Select Manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {users.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="serviceArea">Service Area</Label>
                            <Select
                                value={formData.serviceAreaId}
                                onValueChange={v => setFormData({ ...formData, serviceAreaId: v })}
                            >
                                <SelectTrigger id="serviceArea">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget ($)</Label>
                                <Input
                                    id="budget"
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: formatNumberInput(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-foreground"
                                                    aria-label="Status help"
                                                >
                                                    <HelpCircle className="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
                                                <div className="space-y-1">
                                                    <div><span className="font-semibold">Active</span>: 已開工進行中</div>
                                                    <div><span className="font-semibold">Planning</span>: 規劃中尚未開工</div>
                                                    <div><span className="font-semibold">On Hold</span>: 暫停待重啟</div>
                                                    <div><span className="font-semibold">Completed</span>: 已交付完成</div>
                                                    <div><span className="font-semibold">Cancelled</span>: 已取消不執行</div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select
                                    value={formData.status}
                                    onValueChange={v => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger id="status">
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
