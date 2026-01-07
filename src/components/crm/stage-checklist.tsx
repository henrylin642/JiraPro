'use client';

import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STAGE_CHECKLISTS } from '@/lib/crm-constants';
import { updateOpportunityChecklist } from '@/app/admin/crm/actions';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

    // Get items for current stage. If none, show nothing or previous stages?
    // User request implies "Show items for current stage".
    const currentItems = STAGE_CHECKLISTS[stage];

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

    if (!currentItems || currentItems.length === 0) {
        return null; // Don't show if no checklist for this stage (e.g. Lead or Closed)
    }

    return (
        <Card className="mb-6 border-l-4 border-l-primary/50">
            <CardHeader className="py-3">
                <CardTitle className="text-base flex justify-between items-center">
                    <span>{stage.replace('_', ' ')} Checklist</span>
                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-3">
                {currentItems.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2">
                        <Checkbox
                            id={item.id}
                            checked={checklist.includes(item.id)}
                            onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
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
                <div className="pt-2">
                    <Badge variant="outline" className="text-xs font-normal bg-muted">
                        Completing items automatically increases deal probability.
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
