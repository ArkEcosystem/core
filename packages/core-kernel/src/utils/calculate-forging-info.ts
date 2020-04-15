import { Crypto } from "@arkecosystem/crypto";

import { ForgingInfo, RoundInfo } from "../contracts/shared";

export const calculateForgingInfo = (
    timestamp: number,
    height: number,
    roundInfo: RoundInfo,
    getTimeStampForBlock: (blockheight: number) => number,
): ForgingInfo => {
    const slotInfo = Crypto.Slots.getSlotInfo(getTimeStampForBlock, timestamp, height);

    if (height > roundInfo.roundHeight + roundInfo.maxDelegates) {
        throw new Error(
            `Cannot calculate currentForger: height ${height} should not appear in round ${roundInfo.roundHeight}`,
        );
    }
    const currentForger = height - roundInfo.roundHeight;
    const nextForger = (height - roundInfo.roundHeight + 1) % roundInfo.maxDelegates;
    const canForge = slotInfo.forgingStatus;

    return { currentForger, nextForger, blockTimestamp: slotInfo.startTime, canForge };
};
