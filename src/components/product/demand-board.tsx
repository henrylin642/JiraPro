'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThumbsUp, GitPullRequest, Plus } from 'lucide-react';


import { createIdea, voteIdea, promoteToFeature, updateIdea, deleteIdea } from '@/app/admin/product/actions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

type Idea = {
    id: string;
    title: string;
    description: string | null;
    votes: number;
    createdAt: Date;
    creator: { name: string };
    feature?: { id: string; title: string; status: string } | null;
};

type User = {
    id: string;
    name: string;
};

type Product = {
    id: string;
    name: string;
};

export function DemandBoard({ ideas, users, products }: { ideas: Idea[], users: User[], products: Product[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

    // Form states
    const [newIdea, setNewIdea] = useState({ title: '', description: '', creatorId: users[0]?.id || '' });
    const [promoteProductId, setPromoteProductId] = useState(products[0]?.id || '');

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [editIdea, setEditIdea] = useState<Idea | null>(null);

    const handleCreate = async () => {
        // This is now handled by the IdeaDialog onSave prop, but we keep this empty implementation or remove it 
        // if the dialog calls createIdea directly. But wait, createIdea matches signature.
        // Actually, the onSave prop matches (data) => Promise<void>.
        // Re-read IdeaDialog usage: onSave={createIdea}
        // createIdea is an async server action: (data: {title, description, creatorId}) => Promise<void>
        // It matches.
    };

    // We need these restore for existing JSX below
    const handleVote = async (id: string) => {
        await voteIdea(id);
    };

    const handlePromoteClick = (id: string) => {
        setSelectedIdeaId(id);
        setIsPromoteOpen(true);
    };

    const handlePromoteSubmit = async () => {
        if (selectedIdeaId && promoteProductId) {
            await promoteToFeature(selectedIdeaId, promoteProductId);
            setIsPromoteOpen(false);
            setSelectedIdeaId(null);
        }
    };

    const handleDelete = async () => {
        if (deleteTargetId) {
            await deleteIdea(deleteTargetId);
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="space-y-6">
            <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Idea?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this idea. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <IdeaDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSave={createIdea}
                users={users}
                title="Submit New Idea"
                submitLabel="Submit"
            />

            <IdeaDialog
                open={!!editIdea}
                onOpenChange={(open) => !open && setEditIdea(null)}
                onSave={async (data) => { if (editIdea) await updateIdea(editIdea.id, data); }}
                initialData={editIdea ? { title: editIdea.title, description: editIdea.description || '', creatorId: (editIdea.creator as any).id || users[0]?.id } : undefined}
                users={users}
                title="Edit Idea"
                submitLabel="Update"
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Demand Portal</h2>
                    <p className="text-muted-foreground">Collect and prioritize product ideas.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Submit Idea
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map(idea => (
                    <Card key={idea.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg flex items-center justify-between w-full">
                                    <span>{idea.title}</span>
                                    <div className="flex items-center gap-2">
                                        {idea.feature ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                Promoted
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">New</Badge>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditIdea(idea)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTargetId(idea.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardTitle>
                            </div>
                            <CardDescription>by {idea.creator.name} • <span suppressHydrationWarning>{new Date(idea.createdAt).toLocaleDateString()}</span></CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.description}</p>
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={() => handleVote(idea.id)} className="text-muted-foreground hover:text-primary">
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                {idea.votes} Votes
                            </Button>

                            {!idea.feature && (
                                <Button variant="outline" size="sm" onClick={() => handlePromoteClick(idea.id)}>
                                    <GitPullRequest className="mr-2 h-4 w-4" />
                                    Promote
                                </Button>
                            )}

                            {idea.feature && (
                                <span className="text-xs text-muted-foreground">
                                    Feature: {idea.feature.title}
                                </span>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Promote to Feature</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            This will create a new feature in the product backlog linked to this idea.
                        </p>
                        <div className="space-y-2">
                            <Label>Select Product</Label>
                            <Select
                                value={promoteProductId}
                                onValueChange={setPromoteProductId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handlePromoteSubmit}>Promote</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Reusable Idea Dialog
function IdeaDialog({
    open,
    onOpenChange,
    onSave,
    users,
    initialData,
    title,
    submitLabel
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (data: { title: string, description: string, creatorId: string }) => Promise<void>,
    users: User[],
    initialData?: { title: string, description: string, creatorId: string },
    title: string,
    submitLabel: string
}) {
    const [data, setData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        creatorId: initialData?.creatorId || users[0]?.id || ''
    });

    // Reset form when opened for creation (no initialData)
    React.useEffect(() => {
        if (open && !initialData) {
            setData({ title: '', description: '', creatorId: users[0]?.id || '' });
        } else if (open && initialData) {
            setData(initialData);
        }
    }, [open, initialData, users]);

    const handleSubmit = async () => {
        await onSave(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={data.title}
                            onChange={(e) => setData({ ...data, title: e.target.value })}
                            placeholder="e.g. Mobile App Dark Mode"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={data.description}
                            onChange={(e) => setData({ ...data, description: e.target.value })}
                            placeholder="Describe the value and requirements..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Submitted By</Label>
                        <Select
                            value={data.creatorId}
                            onValueChange={(val) => setData({ ...data, creatorId: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{submitLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
