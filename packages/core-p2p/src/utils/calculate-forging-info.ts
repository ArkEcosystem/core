import { RoundInfo } from "@arkecosystem/core-kernel/src/contracts/shared";
import { Crypto } from "@arkecosystem/crypto";

export const calculateForgingInfo = (timestamp: number, height: number, roundInfo: RoundInfo): ForgingInfo => {
    const blockTimestamp = Crypto.Slots.getSlotTime(Crypto.Slots.getSlotNumber(timestamp));
    const currentForger = height - roundInfo.roundHeight;
    const nextForger = (height - roundInfo.roundHeight + 1) % roundInfo.maxDelegates;

    /** TODO: write tests for this (and check against previous implementation)
        Why was Slots.isForgingAllowed() not previously used here?

        Previous implementation:

        const canForge = parseInt((1 + lastBlock.data.timestamp / blockTime) as any) * blockTime < timestamp - 1
     */
    const canForge = Crypto.Slots.isForgingAllowed(timestamp);

    return { currentForger, nextForger, blockTimestamp, canForge };
};

export interface ForgingInfo {
    currentForger: number;
    nextForger: number;
    blockTimestamp: number;
    canForge: boolean;
}
