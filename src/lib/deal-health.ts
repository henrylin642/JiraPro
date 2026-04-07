import { BASE_PROBABILITIES, STAGE_CHECKLISTS } from '@/lib/crm-constants';

export type DealHealthSignal = {
    id: string;
    label: string;
    severity: 'high' | 'medium' | 'low';
};

export type DealHealthBreakdown = {
    checklistScore: number;
    dataCompletenessScore: number;
    interactionScore: number;
    nextStepScore: number;
    stageAgeScore: number;
};

export type DealHealth = {
    score: number;
    recommendedProbability: number;
    probabilityDelta: number;
    lastInteractionDays: number | null;
    stageAgeDays: number | null;
    openTaskCount: number;
    signals: DealHealthSignal[];
    breakdown: DealHealthBreakdown;
};

export type DealHealthInput = {
    stage: string;
    checklist?: string | string[] | null;
    ownerId?: string | null;
    expectedCloseDate?: Date | string | null;
    estimatedValue?: number | null;
    serviceAreaId?: string | null;
    stageUpdatedAt?: Date | string | null;
    lastInteractionAt?: Date | string | null;
    openTasks?: { dueDate?: Date | string | null }[];
    currentProbability?: number | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toDate = (value?: Date | string | null) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const daysSince = (date: Date | null) => {
    if (!date) return null;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((startOfToday.getTime() - startOfDate.getTime()) / MS_PER_DAY);
};

const parseChecklist = (checklist?: string | string[] | null) => {
    if (!checklist) return [] as string[];
    if (Array.isArray(checklist)) return checklist;
    try {
        const parsed = JSON.parse(checklist);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

function calculateChecklistScore(checklist: string | string[] | null | undefined, stage: string): number {
    const checklistItems = parseChecklist(checklist);
    const stageBase = BASE_PROBABILITIES[stage] ?? 0;

    const checkedWeight = Object.values(STAGE_CHECKLISTS).reduce((sum, items) => {
        return sum + items.reduce((itemSum, item) => itemSum + (checklistItems.includes(item.id) ? item.weight : 0), 0);
    }, 0);

    return clamp(stageBase + checkedWeight);
}

function calculateCompletenessScore(input: DealHealthInput): number {
    const completenessItems = [
        Boolean(input.ownerId),
        Boolean(input.expectedCloseDate),
        typeof input.estimatedValue === 'number' && input.estimatedValue > 0,
        Boolean(input.serviceAreaId),
    ];
    return (completenessItems.filter(Boolean).length / completenessItems.length) * 100;
}

function calculateInteractionScore(lastInteractionDays: number | null): number {
    if (lastInteractionDays === null) return 0;
    if (lastInteractionDays <= 7) return 100;
    if (lastInteractionDays <= 14) return 70;
    if (lastInteractionDays <= 30) return 40;
    return 10;
}

function calculateNextStepScore(openTasks: { dueDate?: Date | string | null }[]): number {
    const openTaskCount = openTasks.length;
    const openDueDates = openTasks.map(task => toDate(task.dueDate)).filter(Boolean) as Date[];
    const today = new Date();

    if (openTaskCount === 0) return 0;
    if (openDueDates.length === 0) return 60;
    if (openDueDates.some(date => date >= today)) return 100;
    return 30;
}

function calculateStageAgeScore(stageAgeDays: number | null): number {
    if (stageAgeDays === null) return 50;
    if (stageAgeDays <= 14) return 100;
    if (stageAgeDays <= 30) return 70;
    if (stageAgeDays <= 60) return 40;
    return 10;
}

function generateHealthSignals(
    input: DealHealthInput,
    checklistScore: number,
    lastInteractionDays: number | null,
    stageAgeDays: number | null,
    openTasks: { dueDate?: Date | string | null }[]
): DealHealthSignal[] {
    const signals: DealHealthSignal[] = [];
    const today = new Date();

    if (!input.ownerId) {
        signals.push({ id: 'no_owner', label: 'No owner assigned', severity: 'high' });
    }
    if (!input.expectedCloseDate) {
        signals.push({ id: 'no_close_date', label: 'Missing close date', severity: 'medium' });
    }

    const expectedCloseDate = toDate(input.expectedCloseDate);
    if (expectedCloseDate && expectedCloseDate < today && input.stage !== 'CLOSED_WON' && input.stage !== 'CLOSED_LOST') {
        signals.push({ id: 'close_date_overdue', label: 'Close date overdue', severity: 'high' });
    }

    if (lastInteractionDays === null || lastInteractionDays > 14) {
        signals.push({ id: 'no_recent_activity', label: 'No recent activity', severity: 'medium' });
    }

    const openTaskCount = openTasks.length;
    const openDueDates = openTasks.map(task => toDate(task.dueDate)).filter(Boolean) as Date[];

    if (openTaskCount === 0) {
        signals.push({ id: 'no_next_step', label: 'No next step scheduled', severity: 'high' });
    } else if (openDueDates.length > 0 && openDueDates.every(date => date < today)) {
        signals.push({ id: 'next_step_overdue', label: 'Next step overdue', severity: 'medium' });
    }

    if (stageAgeDays !== null && stageAgeDays > 30) {
        signals.push({ id: 'stage_stalled', label: 'Stage has stalled', severity: 'medium' });
    }

    if (checklistScore < 40) {
        signals.push({ id: 'low_checklist', label: 'Low qualification completeness', severity: 'low' });
    }

    return signals;
}

function calculateRecommendedProbability(
    input: DealHealthInput,
    checklistScore: number,
    lastInteractionDays: number | null,
    stageAgeDays: number | null,
    openTasks: { dueDate?: Date | string | null }[]
): number {
    let recommendedProbability = checklistScore;
    const today = new Date();
    const expectedCloseDate = toDate(input.expectedCloseDate);
    const openTaskCount = openTasks.length;
    const openDueDates = openTasks.map(task => toDate(task.dueDate)).filter(Boolean) as Date[];

    if (!input.ownerId) recommendedProbability -= 10;
    if (!input.expectedCloseDate) recommendedProbability -= 5;
    if (expectedCloseDate && expectedCloseDate < today) recommendedProbability -= 15;
    if (lastInteractionDays === null || lastInteractionDays > 14) recommendedProbability -= 10;
    if (openTaskCount === 0) recommendedProbability -= 10;
    if (openDueDates.length > 0 && openDueDates.every(date => date < today)) recommendedProbability -= 10;
    if (stageAgeDays !== null && stageAgeDays > 30) recommendedProbability -= 10;

    return clamp(recommendedProbability);
}

export function calculateDealHealth(input: DealHealthInput): DealHealth {
    const checklistScore = calculateChecklistScore(input.checklist, input.stage);
    const completenessScore = calculateCompletenessScore(input);

    const lastInteractionDate = toDate(input.lastInteractionAt);
    const lastInteractionDays = daysSince(lastInteractionDate);
    const interactionScore = calculateInteractionScore(lastInteractionDays);

    const openTasks = input.openTasks ?? [];
    const openTaskCount = openTasks.length;
    const nextStepScore = calculateNextStepScore(openTasks);

    const stageDate = toDate(input.stageUpdatedAt);
    const stageAgeDays = daysSince(stageDate);
    const stageAgeScore = calculateStageAgeScore(stageAgeDays);

    const score = clamp(
        checklistScore * 0.35 +
        completenessScore * 0.2 +
        interactionScore * 0.2 +
        nextStepScore * 0.15 +
        stageAgeScore * 0.1
    );

    const signals = generateHealthSignals(input, checklistScore, lastInteractionDays, stageAgeDays, openTasks);
    const recommendedProbability = calculateRecommendedProbability(input, checklistScore, lastInteractionDays, stageAgeDays, openTasks);

    const currentProbability = typeof input.currentProbability === 'number' ? input.currentProbability : checklistScore;

    return {
        score: Math.round(score),
        recommendedProbability: Math.round(recommendedProbability),
        probabilityDelta: Math.round(recommendedProbability - currentProbability),
        lastInteractionDays,
        stageAgeDays,
        openTaskCount,
        signals,
        breakdown: {
            checklistScore: Math.round(checklistScore),
            dataCompletenessScore: Math.round(completenessScore),
            interactionScore: Math.round(interactionScore),
            nextStepScore: Math.round(nextStepScore),
            stageAgeScore: Math.round(stageAgeScore),
        }
    };
}

export const getHealthLevel = (score: number) => {
    if (score >= 70) return { label: 'Healthy', tone: 'positive' as const };
    if (score >= 40) return { label: 'Watch', tone: 'warning' as const };
    return { label: 'At Risk', tone: 'negative' as const };
};
