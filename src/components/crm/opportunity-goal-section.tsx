'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createDealGoal, deleteDealGoal } from '@/app/admin/crm/actions';

interface Goal {
    id: string;
    description: string;
    targetDate: Date | null;
}

interface OpportunityGoalSectionProps {
    opportunityId: string;
    goals: Goal[];
}

export function OpportunityGoalSection({ opportunityId, goals }: OpportunityGoalSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState('');
    const [newTargetDate, setNewTargetDate] = useState<Date | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddGoal = async () => {
        if (!newGoal.trim()) return;

        setIsLoading(true);
        try {
            await createDealGoal({
                opportunityId,
                description: newGoal,
                targetDate: newTargetDate || null,
            });
            setNewGoal('');
            setNewTargetDate(undefined);
            setIsAdding(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            await deleteDealGoal(id, opportunityId);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle>Strategic Goals</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Goal Description</TableHead>
                                <TableHead className="w-[30%]">Target Date</TableHead>
                                <TableHead className="w-[10%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {goals.map((goal) => (
                                <TableRow key={goal.id}>
                                    <TableCell className="font-medium">{goal.description}</TableCell>
                                    <TableCell>
                                        {goal.targetDate ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CalendarIcon className="h-4 w-4" />
                                                {format(new Date(goal.targetDate), 'PPP')}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {isAdding ? (
                                <TableRow>
                                    <TableCell>
                                        <Input
                                            value={newGoal}
                                            onChange={(e) => setNewGoal(e.target.value)}
                                            placeholder="Enter specific goal..."
                                            className="h-8"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddGoal();
                                                if (e.key === 'Escape') setIsAdding(false);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "h-8 w-full justify-start text-left font-normal",
                                                        !newTargetDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newTargetDate ? format(newTargetDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={newTargetDate}
                                                    onSelect={setNewTargetDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                onClick={handleAddGoal}
                                                disabled={isLoading || !newGoal.trim()}
                                                className="h-8 w-8 p-0"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsAdding(false)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <span className="sr-only">Cancel</span>
                                                <span className="text-lg">×</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                                            onClick={() => setIsAdding(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Goal
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
