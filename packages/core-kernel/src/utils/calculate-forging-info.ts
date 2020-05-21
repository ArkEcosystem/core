import { CryptoSuite } from "@arkecosystem/core-crypto";

import { ForgingInfo } from "../contracts/shared";

export interface MilestoneSearchResult {
    found: boolean;
    height: number;
    data: any;
}

export const getMilestonesWhichAffectActiveDelegateCount = (
    cryptoManager: CryptoSuite.CryptoManager,
): Array<MilestoneSearchResult> => {
    const milestones: Array<MilestoneSearchResult> = [
        {
            found: true,
            height: 1,
            data: cryptoManager.MilestoneManager.getMilestone(1).activeDelegates,
        },
    ];

    let nextMilestone = cryptoManager.MilestoneManager.getNextMilestoneWithNewKey(1, "activeDelegates");

    while (nextMilestone.found) {
        milestones.push(nextMilestone);
        nextMilestone = cryptoManager.MilestoneManager.getNextMilestoneWithNewKey(
            nextMilestone.height,
            "activeDelegates",
        );
    }

    return milestones;
};

const findIndex = (
    height: number,
    slotNumber: number,
    cryptoManager: CryptoSuite.CryptoManager,
    getTimeStampForBlock: (blockheight: number) => number,
): [number, number] => {
    let currentForger;
    let nextForger;
    let slotsNeededAboveSpanToCompleteRound = 0;
    let previousMilestoneActiveDelegates = cryptoManager.MilestoneManager.getMilestone(1).activeDelegates;
    let nextMilestone = cryptoManager.MilestoneManager.getNextMilestoneWithNewKey(1, "activeDelegates");
    let lastSlotInfo = cryptoManager.LibraryManager.Crypto.Slots.getSlotInfo(getTimeStampForBlock, 0, 1);
    let previousForgerIndex = 0;

    const milestones = getMilestonesWhichAffectActiveDelegateCount(cryptoManager);
    if (milestones.length === 1) {
        return [slotNumber % previousMilestoneActiveDelegates, (slotNumber + 1) % previousMilestoneActiveDelegates];
    }

    for (let i = 0; i < milestones.length - 1; i++) {
        if (height <= nextMilestone.height) {
            currentForger = (slotNumber - slotsNeededAboveSpanToCompleteRound) % previousMilestoneActiveDelegates;
            nextForger = (currentForger + 1) % previousMilestoneActiveDelegates;
            return [currentForger, nextForger];
        } else {
            const spanEndBlockTimestamp = getTimeStampForBlock(nextMilestone.height - 1);

            const newSlotInfo = cryptoManager.LibraryManager.Crypto.Slots.getSlotInfo(
                getTimeStampForBlock,
                spanEndBlockTimestamp,
                nextMilestone.height - 1,
            );

            previousForgerIndex = (newSlotInfo.slotNumber - lastSlotInfo.slotNumber) % previousMilestoneActiveDelegates;
            slotsNeededAboveSpanToCompleteRound = previousMilestoneActiveDelegates - previousForgerIndex - 1;
            lastSlotInfo = newSlotInfo;

            if (i !== 0) previousMilestoneActiveDelegates = nextMilestone.data;

            const nextMilestoneData = cryptoManager.MilestoneManager.getNextMilestoneWithNewKey(
                nextMilestone.height,
                "activeDelegates",
            );
            if (nextMilestoneData.found) {
                nextMilestone = nextMilestoneData;
            }
        }
    }

    if (slotNumber - lastSlotInfo.slotNumber <= slotsNeededAboveSpanToCompleteRound) {
        currentForger = previousForgerIndex + (slotNumber - lastSlotInfo.slotNumber);
        nextForger = (currentForger + 1) % previousMilestoneActiveDelegates;
    } else {
        const slotInThisSpan = slotNumber - (lastSlotInfo.slotNumber + slotsNeededAboveSpanToCompleteRound + 1);

        currentForger = slotInThisSpan % nextMilestone.data;
        nextForger = (currentForger + 1) % nextMilestone.data;
    }

    return [currentForger, nextForger];
};

export const calculateForgingInfo = (
    timestamp: number,
    height: number,
    cryptoManager: CryptoSuite.CryptoManager,
    getTimeStampForBlock: (blockheight: number) => number,
): ForgingInfo => {
    const slotInfo = cryptoManager.LibraryManager.Crypto.Slots.getSlotInfo(getTimeStampForBlock, timestamp, height);

    const indexes = findIndex(height, slotInfo.slotNumber, cryptoManager, getTimeStampForBlock);
    const currentForger = indexes[0];
    const nextForger = indexes[1];
    const canForge = slotInfo.forgingStatus;

    return { currentForger, nextForger, blockTimestamp: slotInfo.startTime, canForge };
};
