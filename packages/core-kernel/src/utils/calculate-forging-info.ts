import { Crypto, Managers } from "@arkecosystem/crypto";

import { ForgingInfo } from "../contracts/shared";

export interface MilestoneSearchResult {
    found: boolean;
    height: number;
    data: any;
}

export const getMilestonesWhichAffectActiveDelegateCount = (): Array<MilestoneSearchResult> => {
    const milestones: Array<MilestoneSearchResult> = [
        {
            found: true,
            height: 1,
            data: Managers.configManager.getMilestone(1).activeDelegates,
        },
    ];

    let nextMilestone = Managers.configManager.getNextMilestoneWithNewKey(1, "activeDelegates");

    while (nextMilestone.found) {
        milestones.push(nextMilestone);
        nextMilestone = Managers.configManager.getNextMilestoneWithNewKey(nextMilestone.height, "activeDelegates");
    }

    return milestones;
};

const findIndex = (
    height: number,
    slotNumber: number,
    getTimeStampForBlock: (blockheight: number) => number,
): [number, number] => {
    let currentForger;
    let nextForger;
    let slotsNeededAboveSpanToCompleteRound = 0;
    let previousMilestoneActiveDelegates = Managers.configManager.getMilestone(1).activeDelegates;
    let nextMilestone = Managers.configManager.getNextMilestoneWithNewKey(1, "activeDelegates");

    for (let i = 0; i < getMilestonesWhichAffectActiveDelegateCount().length - 1; i++) {
        if (height <= nextMilestone.height) {
            currentForger = (slotNumber - slotsNeededAboveSpanToCompleteRound) % previousMilestoneActiveDelegates;
            nextForger = (currentForger + 1) % previousMilestoneActiveDelegates;
            return [currentForger, nextForger];
        } else {
            const spanEndBlockTimestamp = getTimeStampForBlock(nextMilestone.height - 1);
            const spanEndSlotInfo = Crypto.Slots.getSlotInfo(
                getTimeStampForBlock,
                spanEndBlockTimestamp,
                nextMilestone.height - 1,
            );
            slotsNeededAboveSpanToCompleteRound =
                spanEndSlotInfo.slotNumber - (slotsNeededAboveSpanToCompleteRound % nextMilestone.data);

            previousMilestoneActiveDelegates = nextMilestone.data;
            nextMilestone = Managers.configManager.getNextMilestoneWithNewKey(nextMilestone.height, "activeDelegates");
        }
    }

    if (currentForger === undefined) {
        // TODO: need to account for when the number of active delegates is changing mid-round
        currentForger = (slotNumber - slotsNeededAboveSpanToCompleteRound) % previousMilestoneActiveDelegates;
        nextForger = (currentForger + 1) % previousMilestoneActiveDelegates;
    }

    return [Math.abs(currentForger), Math.abs(nextForger)];
};

export const calculateForgingInfo = (
    timestamp: number,
    height: number,
    getTimeStampForBlock: (blockheight: number) => number,
): ForgingInfo => {
    const slotInfo = Crypto.Slots.getSlotInfo(getTimeStampForBlock, timestamp, height);

    const indexes = findIndex(height, slotInfo.slotNumber, getTimeStampForBlock);
    const currentForger = indexes[0];
    const nextForger = indexes[1];
    const canForge = slotInfo.forgingStatus;

    return { currentForger, nextForger, blockTimestamp: slotInfo.startTime, canForge };
};
