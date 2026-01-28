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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createOpportunity } from '@/app/admin/crm/actions';
import { Plus } from 'lucide-react';
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

export function AddOpportunityDialog({ accounts }: { accounts: Account[] }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reasonRequired, setReasonRequired] = useState(false);
    const [reasonHint, setReasonHint] = useState('');
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        accountId: '',
        stage: 'LEAD',
        estimatedValue: 0,
        probability: 10,
        expectedCloseDate: '',
        probabilityOverrideReason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setReasonRequired(false);
        setReasonHint('');

        try {
            const result = await createOpportunity({
                title: formData.title,
                accountId: formData.accountId,
                stage: formData.stage,
                estimatedValue: Number(formData.estimatedValue),
                probability: Number(formData.probability),
                expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
                probabilityOverrideReason: formData.probabilityOverrideReason,
            });
            if (!result?.success) {
                if (result?.error === 'PROBABILITY_REASON_REQUIRED') {
                    setReasonRequired(true);
                    setReasonHint('機率與建議差距 ≥ 20%，請填寫原因。');
                    return;
                }
                alert('Failed to create opportunity');
                return;
            }
            setOpen(false);
            setFormData({
                title: '',
                accountId: '',
                stage: 'LEAD',
                estimatedValue: 0,
                probability: 10,
                expectedCloseDate: '',
                probabilityOverrideReason: '',
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to create opportunity');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Opportunity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Opportunity</DialogTitle>
                    <DialogDescription>
                        Create a new sales opportunity.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="account" className="text-right">
                                Account
                            </Label>
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
                            <Label htmlFor="stage" className="text-right">
                                Stage
                            </Label>
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
                            <Label htmlFor="value" className="text-right">
                                Value ($)
                            </Label>
                            <Input
                                id="value"
                                type="number"
                                value={formData.estimatedValue}
                                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="probability" className="text-right">
                                Prob. (%)
                            </Label>
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
                                <Label htmlFor="probabilityOverrideReason" className="text-right">
                                    Reason
                                </Label>
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
                            <Label htmlFor="closeDate" className="text-right">
                                Target Date
                            </Label>
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
                            {isLoading ? 'Creating...' : 'Create Opportunity'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
