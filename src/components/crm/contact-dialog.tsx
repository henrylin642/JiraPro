'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addContact, updateContact } from '@/app/admin/crm/account-actions';

interface Contact {
    id: string;
    name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    linkedIn: string | null;
}

interface ContactDialogProps {
    trigger?: React.ReactNode;
    accountId: string;
    contact?: Contact; // If provided, we are in Edit mode
}

export function ContactDialog({ trigger, accountId, contact }: ContactDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        email: '',
        phone: '',
        linkedIn: ''
    });

    useEffect(() => {
        if (contact && open) {
            setFormData({
                name: contact.name,
                title: contact.title || '',
                email: contact.email || '',
                phone: contact.phone || '',
                linkedIn: contact.linkedIn || ''
            });
        } else if (!contact && open) {
            setFormData({ name: '', title: '', email: '', phone: '', linkedIn: '' });
        }
    }, [contact, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (contact) {
                await updateContact(contact.id, formData);
            } else {
                await addContact(accountId, formData);
            }
            setFormData({ name: '', title: '', email: '', phone: '', linkedIn: '' });
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
                    <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name <span className="text-red-500">*</span></Label>
                        <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. CEO" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (contact ? 'Update Contact' : 'Add Contact')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
