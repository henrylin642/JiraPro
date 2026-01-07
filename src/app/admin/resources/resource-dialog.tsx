'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateResource, UpdateResourceData } from './actions';

interface ResourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resource: {
        id: string;
        name: string;
        role: string;
        resourceProfile: {
            title: string | null;
            skills: string | null;
            costRate: any; // Decimal
            billableRate: any; // Decimal
            monthlySalary: any; // Decimal
            capacityHours: number;
        } | null;
    };
}

export function ResourceDialog({ open, onOpenChange, resource }: ResourceDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UpdateResourceData>({
        name: resource.name,
        role: resource.role,
        title: resource.resourceProfile?.title || '',
        skills: resource.resourceProfile?.skills || '',
        monthlySalary: Number(resource.resourceProfile?.monthlySalary) || 0,
        costRate: Number(resource.resourceProfile?.costRate) || 0,
        billableRate: Number(resource.resourceProfile?.billableRate) || 0,
        capacityHours: resource.resourceProfile?.capacityHours || 40,
    });

    const calculateRates = (salary: number) => {
        // Cost/Hr = Salary / 30 days / 8 hours
        const cost = Math.round((salary / 30 / 8) * 100) / 100;
        // Bill/Hr = Cost * 2
        const bill = Math.round((cost * 2) * 100) / 100;
        return { cost, bill };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'monthlySalary') {
            const salary = Number(value);
            const { cost, bill } = calculateRates(salary);
            setFormData(prev => ({
                ...prev,
                monthlySalary: salary,
                costRate: cost,
                billableRate: bill
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'costRate' || name === 'billableRate' || name === 'capacityHours'
                    ? Number(value)
                    : value
            }));
        }
    };

    const handleRoleChange = (value: string) => {
        setFormData(prev => ({ ...prev, role: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateResource(resource.id, formData);
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Resource: {resource.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="OBSERVER">Observer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="skills" className="text-right">Skills</Label>
                        <Input
                            id="skills"
                            name="skills"
                            value={formData.skills || ''}
                            onChange={handleChange}
                            placeholder="Java, Python, React"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="monthlySalary" className="text-right">Monthly Salary</Label>
                        <Input
                            id="monthlySalary"
                            name="monthlySalary"
                            type="number"
                            value={formData.monthlySalary}
                            onChange={handleChange}
                            placeholder="Auto-calculates rates"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="costRate" className="text-right">Cost/Hr</Label>
                        <Input
                            id="costRate"
                            name="costRate"
                            type="number"
                            value={formData.costRate}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="billableRate" className="text-right">Bill/Hr</Label>
                        <Input
                            id="billableRate"
                            name="billableRate"
                            type="number"
                            value={formData.billableRate}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="capacityHours" className="text-right">Capacity</Label>
                        <Input
                            id="capacityHours"
                            name="capacityHours"
                            type="number"
                            value={formData.capacityHours}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
