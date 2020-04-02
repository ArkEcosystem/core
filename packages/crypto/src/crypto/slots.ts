import dayjs from "dayjs";

import { configManager } from "../managers";
import { calculateBlockTime, isNewBlockTime } from "../utils/block-time-calculator";

type SlotNumber = number;

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
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const lastKnownHeight = this.getLatestHeight(height);

        return this.calculateSlotNumber(timestamp, lastKnownHeight, !!height);
    }

    public static getSlotTime(slot: number): number {
        return this.calculateSlotTime(slot);
    }

    public static getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    public static isForgingAllowed(timestamp?: number, height?: number): boolean {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const lastKnownHeight = this.getLatestHeight(height);
        const blockTime: number = calculateBlockTime(lastKnownHeight);

        return timestamp % blockTime < blockTime / 2;
    }

    private static calculateSlotTime(slot): number {
        let total = 0;
        let lastHeight = 1;
        let blocktime = calculateBlockTime(lastHeight);
        let nextMilestone = configManager.getNextMilestoneWithNewKey(lastHeight, "blocktime");

        for (let i = 0; i <= configManager.getMilestones().length; i++) {
            if (nextMilestone.found && nextMilestone.height <= slot) {
                total += blocktime * (nextMilestone.height - lastHeight);
                lastHeight = nextMilestone.height;
                blocktime = nextMilestone.data;
                nextMilestone = configManager.getNextMilestoneWithNewKey(lastHeight, "blocktime");
            } else {
                total += blocktime * (slot - lastHeight + 1);
                break;
            }
        }
        return total;
    }

    private static calculateSlotNumber(timestamp: number, height: number, searchSpecificHeight = true): SlotNumber {
        let blocktime = calculateBlockTime(1);
        let slotStartTime = 0;
        let slotEndTime = slotStartTime + blocktime - 1;

        // TODO: should we start from 1 each time, or store these variables somewhere for efficiency when doing the next computation?
        for (let currentHeight = 1; currentHeight <= height; currentHeight++) {
            if (!searchSpecificHeight || currentHeight === height) {
                if (timestamp >= slotStartTime && timestamp <= slotEndTime) {
                    return currentHeight - 1;
                }
            } else {
                blocktime = this.calculateNewBlockTime(currentHeight + 1, blocktime);
                slotStartTime = slotEndTime + 1;
                slotEndTime = slotStartTime + blocktime - 1;
            }
        }

        if (slotEndTime < timestamp) {
            if (searchSpecificHeight) {
                throw new Error(`Given timestamp exists in a future block`);
            } else {
                const numberOfBlocksToPeek = 20000000;
                // Number is arbitrarily defined - use a while loop instead?
                height += numberOfBlocksToPeek;
                // TODO: code duplication, move out to separate function
                for (let currentHeight = 1; currentHeight <= height; currentHeight++) {
                    if (timestamp >= slotStartTime && timestamp <= slotEndTime) {
                        return currentHeight - 1;
                    }

                    blocktime = this.calculateNewBlockTime(currentHeight + 1, blocktime);
                    slotStartTime = slotEndTime + 1;
                    slotEndTime = slotStartTime + blocktime - 1;
                }

                throw new Error(`Slot doesn't appear in the near future`);
            }
        } else {
            throw new Error(`Given timestamp exists in a previous block`);
        }
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

    private static calculateNewBlockTime(height: number, previousBlockTime: number) {
        return isNewBlockTime(height) ? calculateBlockTime(height) : previousBlockTime;
    }
}
