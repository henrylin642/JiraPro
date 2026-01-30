'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTask, createTask, deleteTask, getTaskFormData } from '@/app/admin/project/actions';
import { useRouter } from 'next/navigation';

interface TaskDialogProps {
    task?: any;
    projectId?: string;
    opportunityId?: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    projects?: { id: string; name: string }[];
    opportunities?: { id: string; title: string }[];
}

export function TaskDialog({ task, projectId, opportunityId, trigger, open, onOpenChange, projects = [], opportunities = [] }: TaskDialogProps) {
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
        parentId: '',
        contextType: 'PROJECT', // 'PROJECT' | 'OPPORTUNITY'
        contextId: '',
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
                    parentId: task.parentId || 'none',
                    contextType: 'PROJECT',
                    contextId: ''
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
                    parentId: 'none',
                    contextType: 'PROJECT',
                    contextId: ''
                });
            }
            fetchOptions();
        }
    }, [isDialogOpen, task]);

    const fetchOptions = async () => {
        // Fetch users and tasks
        // If we have direct props projectId or opportunityId, use them.
        // Otherwise use form selection context id.
        const activeProjectId = projectId || (formData.contextType === 'PROJECT' && formData.contextId ? formData.contextId : undefined);
        const data = await getTaskFormData(activeProjectId);
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
                // Pass opportunityId if creating/updating for an opportunity
                result = await updateTask(task.id, projectId, { ...payload, opportunityId });
            } else {
                // Determine context from props OR form
                const targetProjectId = projectId || (formData.contextType === 'PROJECT' ? formData.contextId : undefined);
                const targetOpportunityId = opportunityId || (formData.contextType === 'OPPORTUNITY' ? formData.contextId : undefined);

                if (!targetProjectId && !targetOpportunityId) {
                    alert('Please select a Project or Opportunity');
                    setLoading(false);
                    return;
                }

                result = await createTask(targetProjectId, { ...payload, opportunityId: targetOpportunityId });
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

    const handleDelete = async () => {
        if (!task) return;
        const confirmed = confirm('確定要刪除此任務？相關工時記錄也會一併刪除。');
        if (!confirmed) return;
        setLoading(true);
        const targetProjectId = projectId || task.projectId;
        const targetOpportunityId = opportunityId || task.opportunityId;
        const result = await deleteTask(task.id, targetProjectId, targetOpportunityId);
        if (result.success) {
            setIsDialogOpen(false);
            router.refresh();
        } else {
            alert(`Error: ${result.error}`);
        }
        setLoading(false);
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Context Selection if global create */}
                    {!task && !projectId && !opportunityId && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md border border-dashed">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={formData.contextType}
                                    onValueChange={v => {
                                        handleChange('contextType', v);
                                        handleChange('contextId', ''); // Reset ID
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROJECT">Project</SelectItem>
                                        <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Select {formData.contextType === 'PROJECT' ? 'Project' : 'Opportunity'}</Label>
                                <Select value={formData.contextId} onValueChange={v => handleChange('contextId', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formData.contextType === 'PROJECT' && projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                        {formData.contextType === 'OPPORTUNITY' && opportunities.map(o => (
                                            <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
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

                    <div className="flex justify-between gap-2 pt-4">
                        {task ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                刪除任務
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
