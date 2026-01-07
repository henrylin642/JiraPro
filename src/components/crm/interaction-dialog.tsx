'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logInteraction } from '@/app/admin/crm/account-actions';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InteractionDialogProps {
    trigger?: React.ReactNode;
    accountId: string;
}

// TODO: In a real app, get current userId from Session
const MOCK_USER_ID = 'user-id-placeholder';

export function InteractionDialog({ trigger, accountId }: InteractionDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>(new Date());
    const [formData, setFormData] = useState({
        type: 'MEETING',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Need a way to get Current User ID. For now hardcoding or using the first user from seed if possible, 
            // but since this is client side, we'll rely on server action to handle user or pass a mock.
            // The server action expects userId. 
            // Let's assume we pass a placeholder and the server handles it or we need to fetch it.
            // For now, I'll pass a known ID from the seed manually if I knew it, or let's use a "System" user concept.
            // Actually, let's fix the server action to use a default or params.
            // Wait, the seed created an Admin user. I'll need to fetch a user ID. 
            // For this iterate, I will hardcode the Admin ID from the seed if I can find it, or fix the action.
            // BETTER: pass a temporary ID, and I'll update the action to look up a user if needed.

            // To make it work immediately without Auth/Session logic implemented yet:
            // I'll fetch the first user in the action if userId is missing/invalid, or just pass a dummy string 
            // and ensure the database has that user or the action handles it.
            // Let's assume the user is "Admin" for now which we seeded. I'll use a placeholder and handle in action.

            await logInteraction(accountId, "mock-user-id", { ...formData, date });
            setFormData({ type: 'MEETING', notes: '' });
            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Interaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select value={formData.type} onValueChange={(val) => setFormData(p => ({ ...p, type: val }))}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MEETING">Meeting</SelectItem>
                                <SelectItem value="CALL">Call</SelectItem>
                                <SelectItem value="EMAIL">Email</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">Notes</Label>
                        <Textarea
                            id="notes"
                            className="col-span-3"
                            value={formData.notes}
                            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Log Interaction'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
