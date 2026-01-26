'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STAGE_CHECKLISTS, STAGE_LABELS, STAGE_ORDER } from '@/lib/crm-constants';
import { updateOpportunityChecklist } from '@/app/admin/crm/actions';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StageChecklist({
    opportunityId,
    stage,
    initialChecklist
}: {
    opportunityId: string;
    stage: string;
    initialChecklist: string[]
}) {
    const [checklist, setChecklist] = useState<string[]>(initialChecklist);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCheck = async (itemId: string, checked: boolean) => {
        setIsUpdating(true);
        let newChecklist = [...checklist];
        if (checked) {
            newChecklist.push(itemId);
        } else {
            newChecklist = newChecklist.filter(id => id !== itemId);
        }
        setChecklist(newChecklist);

        await updateOpportunityChecklist(opportunityId, newChecklist);
        setIsUpdating(false);
    };

    return (
        <div className="space-y-6">
            {STAGE_ORDER.map((stageKey) => {
                const items = STAGE_CHECKLISTS[stageKey];
                if (!items || items.length === 0) return null;

                const isCurrentStage = stageKey === stage;
                // Determine if this stage is "passed" (lower index than current)
                const isPassed = STAGE_ORDER.indexOf(stageKey) < STAGE_ORDER.indexOf(stage);

                return (
                    <Card
                        key={stageKey}
                        className={cn(
                            "transition-all duration-200",
                            isCurrentStage ? "border-l-4 border-l-primary shadow-md" : "border-l-4 border-l-transparent opacity-80 hover:opacity-100"
                        )}
                    >
                        <CardHeader className="py-3 bg-muted/20">
                            <CardTitle className="text-base flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span>{STAGE_LABELS[stageKey]} ({stageKey})</span>
                                    {isCurrentStage && <Badge variant="default" className="text-xs">Current Stage</Badge>}
                                    {isPassed && <Badge variant="outline" className="text-xs text-muted-foreground">Completed</Badge>}
                                </div>
                                {isUpdating && isCurrentStage && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 space-y-3 pt-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-2">
                                    <Checkbox
                                        id={item.id}
                                        checked={checklist.includes(item.id)}
                                        onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                                        disabled={isUpdating}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor={item.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {item.label}
                                        </label>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            +{item.weight}% Probability
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}

            <div className="pt-2">
                <Badge variant="outline" className="text-xs font-normal bg-muted">
                    Checking items updates the opportunity stage and probability automatically.
                </Badge>
            </div>
        </div>
    );
}
