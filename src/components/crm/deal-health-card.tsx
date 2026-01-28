'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { DealHealth, getHealthLevel } from '@/lib/deal-health';

const signalTone = (severity: 'high' | 'medium' | 'low') => {
    if (severity === 'high') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (severity === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
};

export function DealHealthCard({ health, currentProbability }: { health: DealHealth; currentProbability: number }) {
    const level = getHealthLevel(health.score);
    const delta = health.probabilityDelta;
    const deltaLabel = delta > 0 ? `+${delta}%` : `${delta}%`;
    const deltaTone = Math.abs(delta) >= 20 ? 'text-rose-600' : 'text-muted-foreground';

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle>Deal Health</CardTitle>
                    <Badge
                        variant="outline"
                        className={cn(
                            'font-semibold',
                            level.tone === 'positive'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : level.tone === 'warning'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-rose-100 text-rose-700 border-rose-200'
                        )}
                    >
                        {level.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="text-xs uppercase text-muted-foreground tracking-wider">Health Score</div>
                        <div className="text-3xl font-bold">{health.score}</div>
                        <Progress value={health.score} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs uppercase text-muted-foreground tracking-wider">Recommended Prob.</div>
                        <div className="text-2xl font-semibold">{health.recommendedProbability}%</div>
                        <div className="text-xs text-muted-foreground">
                            Current: {currentProbability}% · <span className={deltaTone}>{deltaLabel}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs uppercase text-muted-foreground tracking-wider">Signals</div>
                        <div className="flex flex-wrap gap-2">
                            {health.signals.length === 0 ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    No major risks
                                </Badge>
                            ) : (
                                health.signals.map((signal) => (
                                    <Badge key={signal.id} variant="outline" className={cn('text-xs', signalTone(signal.severity))}>
                                        {signal.label}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div>Last activity: {health.lastInteractionDays === null ? 'No data' : `${health.lastInteractionDays} days ago`}</div>
                    <div>Stage age: {health.stageAgeDays === null ? 'No data' : `${health.stageAgeDays} days`}</div>
                    <div>Open next steps: {health.openTaskCount}</div>
                </div>
            </CardContent>
        </Card>
    );
}
