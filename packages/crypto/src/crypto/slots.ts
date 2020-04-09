import dayjs from "dayjs";

import { configManager } from "../managers/config";
import { calculateBlockTime } from "../utils/block-time-calculator";

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

    public static getSlotNumber(
        timestamp?: number,
        height?: number,
        getTimeStampForBlock?: (blockheight: number) => number,
    ): number {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const latestHeight = this.getLatestHeight(height);

        // TODO: this is now required when looking up dynamic block times - how should we handle this?
        if (getTimeStampForBlock === undefined) {
            throw new Error(`Dynamic block times require lookup`);
        }

        return this.getSlotInfo(timestamp, latestHeight, getTimeStampForBlock).slotNumber;
    }

    public static getSlotTime(
        slot: number,
        height?: number,
        getTimeStampForBlock?: (blockheight: number) => number,
    ): number {
        const latestHeight = this.getLatestHeight(height);

        // TODO: this is now required when looking up dynamic block times - how should we handle this?
        if (getTimeStampForBlock === undefined) {
            throw new Error(`Dynamic block times require lookup`);
        }

        return this.calculateSlotTime(slot, latestHeight, getTimeStampForBlock);
    }

    public static getNextSlot(): number {
        return this.getSlotNumber() + 1;
    }

    public static isForgingAllowed(
        timestamp?: number,
        height?: number,
        getTimeStampForBlock?: (blockheight: number) => number,
    ): boolean {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const latestHeight = this.getLatestHeight(height);

        // TODO: this is now required when looking up dynamic block times - how should we handle this?
        if (getTimeStampForBlock === undefined) {
            throw new Error(`Dynamic block times require blockdata lookup`);
        }

        return this.getSlotInfo(timestamp, latestHeight, getTimeStampForBlock).forgingStatus;
    }

    public static getSlotInfo(
        timestamp: number,
        height: number,
        getTimeStampForBlock: (blockheight: number) => number,
    ): SlotInfo {
        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let lastSpanEndTime = 0;
        let previousMilestoneHeight = 1;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");

        for (let i = 0; i < configManager.getMilestones().length - 1; i++) {
            if (height < nextMilestone.height) {
                const slotNumerUpUntilThisTimestamp = Math.floor((timestamp - lastSpanEndTime) / blockTime);
                const slotNumber = totalSlotsFromLastSpan + slotNumerUpUntilThisTimestamp;
                const startTime = lastSpanEndTime + slotNumerUpUntilThisTimestamp * blockTime;
                const endTime = startTime + blockTime - 1;
                const forgingStatus = timestamp < startTime + Math.ceil(blockTime / 2);

                const slotInfo: SlotInfo = {
                    blockTime,
                    startTime,
                    endTime,
                    slotNumber,
                    forgingStatus,
                };

                return slotInfo;
            } else {
                const spanStartTimestamp = getTimeStampForBlock(previousMilestoneHeight);
                previousMilestoneHeight = nextMilestone.height - 1;
                lastSpanEndTime = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;
                totalSlotsFromLastSpan += Math.floor((lastSpanEndTime - spanStartTimestamp) / blockTime);
                blockTime = nextMilestone.data;
                nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
            }
        }

        const slotNumerUpUntilThisTimestamp = Math.floor((timestamp - lastSpanEndTime) / blockTime);
        const slotNumber = totalSlotsFromLastSpan + slotNumerUpUntilThisTimestamp - 1;
        const startTime = lastSpanEndTime + slotNumerUpUntilThisTimestamp * blockTime;
        const endTime = startTime + blockTime - 1;
        const forgingStatus = timestamp < startTime + Math.ceil(blockTime / 2);

        const slotInfo: SlotInfo = {
            blockTime,
            startTime,
            endTime,
            slotNumber,
            forgingStatus,
        };

        return slotInfo;
    }

    private static calculateSlotTime(
        slotNumber: number,
        height: number,
        getTimeStampForBlock: (blockheight: number) => number,
    ): number {
        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let previousMilestoneHeight = 1;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");
        let totalTimespan = 0;

        for (let i = 0; i < configManager.getMilestones().length - 1; i++) {
            if (height < nextMilestone.height) {
                return totalTimespan + (slotNumber - totalSlotsFromLastSpan) * blockTime;
            } else {
                const spanStartTimestamp = getTimeStampForBlock(previousMilestoneHeight);
                previousMilestoneHeight = nextMilestone.height - 1;

                totalTimespan = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;

                totalSlotsFromLastSpan += Math.floor((totalTimespan - spanStartTimestamp) / blockTime);

                blockTime = nextMilestone.data;
                nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
            }
        }

        return totalTimespan + (slotNumber - totalSlotsFromLastSpan + 1) * blockTime;
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
}
