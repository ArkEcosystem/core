import dayjs from "dayjs";

import { configManager } from "../managers/config";
import { calculateBlockTime, isNewBlockTime } from "../utils/block-time-calculator";

interface SlotInfo {
    startTime: number;
    endTime: number;
    blockTime: number;
    slotNumber: number;
    forgingStatus: boolean;
}

export class Slots {
    public static getTime(time?: number): number {
        if (time === undefined) {
            time = dayjs().valueOf();
        }

        const start: number = dayjs(configManager.getMilestone(1).epoch).valueOf();

        return Math.floor((time - start) / 1000);
    }

    public static getTimeInMsUntilNextSlot(): number {
        const nextSlotTime: number = this.getSlotTime(this.getNextSlot());
        const now: number = this.getTime();

        return (nextSlotTime - now) * 1000;
    }

    public static getSlotNumber(timestamp?: number, height?: number): number {
        return this.getSlotInfo(timestamp, height).slotNumber;
    }

    public static getSlotInfo(timestamp?: number, height?: number): SlotInfo {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }
        const lastKnownHeight = this.getLatestHeight(height);

        return this.calculateSlotInfo(timestamp, lastKnownHeight, !!height);
    }

    public static getSlotTime(slot: number): number {
        return this.calculateSlotTime(slot);
    }

    public static getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    // TODO: check where this is currently used
    // If possible, call getSlotInfo once to save computation.
    public static isForgingAllowed(timestamp?: number): boolean {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        return this.calculateSlotInfo(timestamp, this.getSlotNumber(timestamp), false, true).forgingStatus;
    }

    private static calculateSlotTime(slot: number): number {
        let total = 0;
        let lastHeight = 1;
        let blockTime = calculateBlockTime(lastHeight);
        let nextMilestone = configManager.getNextMilestoneWithNewKey(lastHeight, "blocktime");

        for (let i = 0; i <= configManager.getMilestones().length; i++) {
            if (nextMilestone.found && nextMilestone.height <= slot) {
                total += blockTime * (nextMilestone.height - lastHeight);
                lastHeight = nextMilestone.height;
                blockTime = nextMilestone.data;
                nextMilestone = configManager.getNextMilestoneWithNewKey(lastHeight, "blocktime");
            } else {
                total += blockTime * (slot - lastHeight + 1);
                break;
            }
        }
        return total;
    }

    private static calculateSlotInfo(
        timestamp: number,
        height: number,
        searchSpecificHeight = true,
        checkForgingStatus = false,
    ): SlotInfo {
        const blockTime = calculateBlockTime(1);

        let slotInfo: SlotInfo = {
            blockTime,
            startTime: 0,
            endTime: blockTime - 1,
            slotNumber: 0, // See TODO: above
            forgingStatus: false,
        };

        // TODO: should we start from 1 each time, or store these variables somewhere for efficiency when doing the next computation?
        for (let currentHeight = 1; currentHeight <= height; currentHeight++) {
            if (!searchSpecificHeight || currentHeight === height) {
                if (this.timestampOccursWithinSlot(timestamp, slotInfo)) {
                    slotInfo.slotNumber = currentHeight - 1;
                    slotInfo.forgingStatus = this.determineForgingStatus(slotInfo, timestamp);
                    return slotInfo;
                }
            } else {
                slotInfo = this.updateSlotInfo(slotInfo, currentHeight);
            }
        }

        if (slotInfo.endTime < timestamp || checkForgingStatus) {
            if (searchSpecificHeight) {
                throw new Error(`Given timestamp exists in a future block`);
            } else {
                const numberOfBlocksToPeek = 20000000;
                // Number is arbitrarily defined - use a while loop instead?
                height += numberOfBlocksToPeek;

                for (let currentHeight = 1; currentHeight <= height; currentHeight++) {
                    if (this.timestampOccursWithinSlot(timestamp, slotInfo)) {
                        slotInfo.slotNumber = currentHeight - 1;
                        slotInfo.forgingStatus = this.determineForgingStatus(slotInfo, timestamp);
                        return slotInfo;
                    }
                    slotInfo = this.updateSlotInfo(slotInfo, currentHeight);
                }

                throw new Error(`Slot doesn't appear in the near future`);
            }
        } else {
            throw new Error(`Given timestamp exists in a previous block`);
        }
    }

    private static determineForgingStatus(slotInfo: SlotInfo, timestamp: number): boolean {
        return timestamp <= slotInfo.endTime - Math.ceil(slotInfo.blockTime / 2);
    }

    private static getLatestHeight(height: number | undefined): number {
        if (!height) {
            // TODO: is the config manager the best way to retrieve most recent height?
            // Or should this class maintain its own cache?
            const configConfiguredHeight = configManager.getHeight();
            if (configConfiguredHeight) {
                return configConfiguredHeight;
            } else {
                return 1;
            }
        }

        return height;
    }

    private static updateSlotInfo(slotInfo: SlotInfo, height: number): SlotInfo {
        slotInfo.blockTime = this.calculateNewBlockTime(height + 1, slotInfo.blockTime);
        slotInfo.startTime = slotInfo.endTime + 1;
        slotInfo.endTime = slotInfo.startTime + slotInfo.blockTime - 1;
        return slotInfo;
    }

    private static calculateNewBlockTime(height: number, previousBlockTime: number) {
        return isNewBlockTime(height) ? calculateBlockTime(height) : previousBlockTime;
    }

    private static timestampOccursWithinSlot(timestamp: number, slotInfo: SlotInfo): boolean {
        return timestamp >= slotInfo.startTime && timestamp <= slotInfo.endTime;
    }
}
