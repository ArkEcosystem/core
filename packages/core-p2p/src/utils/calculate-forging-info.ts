import { Crypto, Utils } from "@arkecosystem/crypto";

export const calculateForgingInfo = (timestamp: number, height: number, maxDelegates: number): ForgingInfo => {
    const blockTime = Utils.calculateBlockTime(height);
    const blockTimestamp = Crypto.Slots.getSlotNumber(timestamp) * blockTime;
    const currentForger = parseInt((timestamp / blockTime) as any) % maxDelegates;
    const nextForger = (parseInt((timestamp / blockTime) as any) + 1) % maxDelegates;

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
