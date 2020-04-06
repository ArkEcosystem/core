import { Crypto } from "@arkecosystem/crypto";

export const calculateForgingInfo = (timestamp: number, height: number, maxDelegates: number): ForgingInfo => {
    const slotNumber = Crypto.Slots.getSlotNumber(timestamp);
    const blockTimestamp = Crypto.Slots.getSlotTime(slotNumber);
    const currentForger = slotNumber % maxDelegates;
    const nextForger = (slotNumber + 1) % maxDelegates;

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
