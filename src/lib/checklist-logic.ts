import { BASE_PROBABILITIES, STAGE_CHECKLISTS, STAGE_ORDER } from '@/lib/crm-constants';

export function calculateStageAndProbability(checklist: string[]) {
    // Find the highest stage that has a checked item
    // We iterate in reverse order of STAGE_ORDER
    let newStage = 'LEAD'; // Default

    for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
        const stage = STAGE_ORDER[i];
        const items = STAGE_CHECKLISTS[stage];
        if (!items) continue;

        // If any item in this stage is checked
        const hasCheckedItem = items.some(item => checklist.includes(item.id));
        if (hasCheckedItem) {
            newStage = stage;
            break;
        }
    }

    // Calculate new probability
    let probability = BASE_PROBABILITIES[newStage] || 0;

    // Find all checked items configurations to add weights
    let addedProb = 0;
    Object.values(STAGE_CHECKLISTS).forEach(list => {
        list.forEach(item => {
            if (checklist.includes(item.id)) {
                addedProb += item.weight;
            }
        });
    });

    // Cap at 100
    probability = Math.min(100, probability + addedProb);

    // Special case overrides
    if (newStage === 'CLOSED_WON') probability = 100;
    if (newStage === 'CLOSED_LOST') probability = 0;

    return { stage: newStage, probability };
}
