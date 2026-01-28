'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getHealthLevel } from '@/lib/deal-health';
import { cn } from '@/lib/utils';

export function HealthBadge({ score, compact = false }: { score: number; compact?: boolean }) {
    const level = getHealthLevel(score);

    const toneClass =
        level.tone === 'positive'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : level.tone === 'warning'
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-rose-100 text-rose-700 border-rose-200';

    return (
        <Badge
            variant="outline"
            className={cn('font-semibold', toneClass, compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2')}
        >
            {compact ? `${score}` : `${level.label} ${score}`}
        </Badge>
    );
}
