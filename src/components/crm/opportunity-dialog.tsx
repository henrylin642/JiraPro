'use client';

import React, { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createOpportunity, updateOpportunity } from '@/app/admin/crm/actions';
import { Plus, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STAGES = [
    'LEAD',
    'QUALIFICATION',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
];

type Account = {
    id: string;
    name: string;
};

type User = {
    id: string;
    name: string;
};

type ServiceArea = {
    id: string;
    name: string;
};

type OpportunityData = {
    id: string;
    title: string;
    accountId: string;
    stage: string;
    estimatedValue: number;
    probability: number;
    expectedCloseDate: Date | null;
    ownerId: string | null;
    serviceAreaId?: string | null;
    probabilityOverrideReason?: string | null;
};

interface OpportunityDialogProps {
    accounts?: Account[];
    users?: User[];
    serviceAreas?: ServiceArea[];
    opportunity?: OpportunityData; // If present, we are in Edit mode
    trigger?: React.ReactNode;
    defaultOpen?: boolean;
}

export function OpportunityDialog({ accounts = [], users = [], serviceAreas = [], opportunity, trigger, defaultOpen }: OpportunityDialogProps) {
    const [open, setOpen] = useState(Boolean(defaultOpen));
    const [isLoading, setIsLoading] = useState(false);
    const [reasonRequired, setReasonRequired] = useState(false);
    const [reasonHint, setReasonHint] = useState('');
    const router = useRouter();

    const isEdit = !!opportunity;

    const [formData, setFormData] = useState({
        title: '',
        accountId: '',
        stage: 'LEAD',
        estimatedValue: 0,
        probability: 10,
        expectedCloseDate: '',
        ownerId: 'unassigned',
        serviceAreaId: 'unassigned',
        probabilityOverrideReason: '',
    });

    useEffect(() => {
        if (defaultOpen) {
            setOpen(true);
        }
    }, [defaultOpen]);

    useEffect(() => {
        if (open) {
            setReasonRequired(false);
            setReasonHint('');
            if (opportunity) {
                setFormData({
                    title: opportunity.title,
                    accountId: opportunity.accountId,
                    stage: opportunity.stage,
                    estimatedValue: opportunity.estimatedValue,
                    probability: opportunity.probability,
                    expectedCloseDate: opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0] : '',
                    ownerId: opportunity.ownerId || 'unassigned',
                    serviceAreaId: opportunity.serviceAreaId || 'unassigned',
                    probabilityOverrideReason: opportunity.probabilityOverrideReason || '',
                });
            } else {
                // Reset for Create mode
                setFormData({
                    title: '',
                    accountId: '',
                    stage: 'LEAD',
                    estimatedValue: 0,
                    probability: 10,
                    expectedCloseDate: '',
                    ownerId: 'unassigned',
                    serviceAreaId: 'unassigned',
                    probabilityOverrideReason: '',
                });
            }
        }
    }, [open, opportunity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setReasonRequired(false);
        setReasonHint('');

        const payload = {
            title: formData.title,
            accountId: formData.accountId,
            stage: formData.stage,
            estimatedValue: Number(formData.estimatedValue),
            probability: Number(formData.probability),
            expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
            ownerId: formData.ownerId === 'unassigned' ? undefined : (formData.ownerId || undefined),
            serviceAreaId: formData.serviceAreaId === 'unassigned' ? undefined : (formData.serviceAreaId || undefined),
            probabilityOverrideReason: formData.probabilityOverrideReason,
        };

        try {
            const result = isEdit && opportunity
                ? await updateOpportunity(opportunity.id, payload)
                : await createOpportunity(payload);

            if (!result?.success) {
                if (result?.error === 'PROBABILITY_REASON_REQUIRED') {
                    setReasonRequired(true);
                    setReasonHint('機率與建議差距 ≥ 20%，請填寫原因。');
                    return;
                }
                alert(`Failed to ${isEdit ? 'update' : 'create'} opportunity`);
                return;
            }

            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${isEdit ? 'update' : 'create'} opportunity`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    isEdit ? (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                        </Button>
                    ) : (
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Opportunity
                        </Button>
                    )
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Opportunity' : 'Add Opportunity'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update opportunity details.' : 'Create a new sales opportunity.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="account" className="text-right">Account</Label>
                            <Select
                                value={formData.accountId}
                                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="owner" className="text-right">Owner</Label>
                            <Select
                                value={formData.ownerId}
                                onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Owner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serviceArea" className="text-right">Service Area</Label>
                            <Select
                                value={formData.serviceAreaId}
                                onValueChange={(value) => setFormData({ ...formData, serviceAreaId: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Area" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {serviceAreas.map((area) => (
                                        <SelectItem key={area.id} value={area.id}>
                                            {area.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stage" className="text-right">Stage</Label>
                            <Select
                                value={formData.stage}
                                onValueChange={(value) => setFormData({ ...formData, stage: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STAGES.map((stage) => (
                                        <SelectItem key={stage} value={stage}>
                                            {stage.replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value" className="text-right">Value ($)</Label>
                            <Input
                                id="value"
                                type="number"
                                value={formData.estimatedValue}
                                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="probability" className="text-right">Prob. (%)</Label>
                            <Input
                                id="probability"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.probability}
                                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        {(reasonRequired || formData.probabilityOverrideReason) && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="probabilityOverrideReason" className="text-right">Reason</Label>
                                <div className="col-span-3 space-y-2">
                                    <Textarea
                                        id="probabilityOverrideReason"
                                        value={formData.probabilityOverrideReason}
                                        onChange={(e) => setFormData({ ...formData, probabilityOverrideReason: e.target.value })}
                                        placeholder="Explain why the probability deviates from the recommendation."
                                        required={reasonRequired}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        當機率與健康度建議差距 ≥ 20% 時必填。
                                    </p>
                                    {reasonHint && (
                                        <p className="text-xs text-destructive">{reasonHint}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="closeDate" className="text-right">Target Date</Label>
                            <Input
                                id="closeDate"
                                type="date"
                                value={formData.expectedCloseDate}
                                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : (isEdit ? 'Update Opportunity' : 'Create Opportunity')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
