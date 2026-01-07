'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTask, createTask, getTaskFormData } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';

interface TaskDialogProps {
    task?: any; // Made optional
    projectId: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TaskDialog({ task, projectId, trigger, open, onOpenChange }: TaskDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Controlled vs Uncontrolled open state
    const isDialogOpen = open !== undefined ? open : isOpen;
    const setIsDialogOpen = onOpenChange || setIsOpen;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: '',
        startDate: '',
        dueDate: '',
        estimatedHours: '',
        parentId: ''
    });

    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        if (isDialogOpen) {
            if (task) {
                setFormData({
                    title: task.title,
                    description: task.description || '',
                    status: task.status,
                    priority: task.priority,
                    assigneeId: task.assigneeId || 'none',
                    startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                    estimatedHours: task.estimatedHours ? String(task.estimatedHours) : '',
                    parentId: task.parentId || 'none'
                });
            } else {
                // Reset form for new task
                setFormData({
                    title: '',
                    description: '',
                    status: 'TODO',
                    priority: 'MEDIUM',
                    assigneeId: 'none',
                    startDate: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    estimatedHours: '',
                    parentId: 'none'
                });
            }
            fetchOptions();
        }
    }, [isDialogOpen, task]);

    const fetchOptions = async () => {
        // Fetch users and tasks
        const data = await getTaskFormData(projectId);
        setUsers(data.users);
        setTasks(data.tasks.filter(t => !task || t.id !== task.id)); // Exclude self
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            title: formData.title,
            description: formData.description || undefined,
            status: formData.status,
            priority: formData.priority,
            assigneeId: formData.assigneeId === 'none' ? undefined : formData.assigneeId,
            startDate: formData.startDate ? new Date(formData.startDate) : undefined,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
            estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
            parentId: formData.parentId === 'none' ? undefined : formData.parentId
        };

        try {
            let result;
            if (task) {
                result = await updateTask(task.id, projectId, payload);
            } else {
                result = await createTask(projectId, payload);
            }

            if (result.success) {
                setIsDialogOpen(false);
                router.refresh();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            required
                            value={formData.title}
                            onChange={e => handleChange('title', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Parent Task</Label>
                        <Select value={formData.parentId} onValueChange={v => handleChange('parentId', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="No Parent" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Parent</SelectItem>
                                {tasks.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="REVIEW">Review</SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={formData.priority} onValueChange={v => handleChange('priority', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Assignee</Label>
                            <Select value={formData.assigneeId} onValueChange={v => handleChange('assigneeId', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Est. Hours</Label>
                            <Input
                                type="number"
                                value={formData.estimatedHours}
                                onChange={e => handleChange('estimatedHours', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e => handleChange('startDate', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => handleChange('dueDate', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
