import dayjs from "dayjs";

import { configManager, MilestoneSearchResult } from "../managers/config";
import { calculateBlockTime } from "../utils/block-time-calculator";

export interface SlotInfo {
    startTime: number;
    endTime: number;
    blockTime: number;
    slotNumber: number;
    forgingStatus: boolean;
}

export type GetBlockTimeStampLookup = (blockheight: number) => number;

export class Slots {
    public static getTime(time?: number): number {
        if (time === undefined) {
            time = dayjs().valueOf();
        }

        const start: number = dayjs(configManager.getMilestone(1).epoch).valueOf();

        return Math.floor((time - start) / 1000);
    }

    public static getTimeInMsUntilNextSlot(getTimeStampForBlock: GetBlockTimeStampLookup): number {
        const nextSlotTime: number = this.getSlotTime(getTimeStampForBlock, this.getNextSlot(getTimeStampForBlock));
        const now: number = this.getTime();

        return (nextSlotTime - now) * 1000;
    }

    public static getSlotNumber(
        getTimeStampForBlock: GetBlockTimeStampLookup,
        timestamp?: number,
        height?: number,
    ): number {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const latestHeight = this.getLatestHeight(height);

        return this.getSlotInfo(timestamp, latestHeight, getTimeStampForBlock).slotNumber;
    }

    public static getSlotTime(getTimeStampForBlock: GetBlockTimeStampLookup, slot: number, height?: number): number {
        const latestHeight = this.getLatestHeight(height);

        // TODO: this is now required when looking up dynamic block times - how should we handle this?
        if (getTimeStampForBlock === undefined) {
            throw new Error(`Dynamic block times require lookup`);
        }

        return this.calculateSlotTime(slot, latestHeight, getTimeStampForBlock);
    }

    public static getNextSlot(getTimeStampForBlock: GetBlockTimeStampLookup): number {
        return this.getSlotNumber(getTimeStampForBlock) + 1;
    }

    public static isForgingAllowed(
        getTimeStampForBlock: GetBlockTimeStampLookup,
        timestamp?: number,
        height?: number,
    ): boolean {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const latestHeight = this.getLatestHeight(height);

        return this.getSlotInfo(timestamp, latestHeight, getTimeStampForBlock).forgingStatus;
    }

    public static getSlotInfo(
        timestamp: number,
        height: number,
        getTimeStampForBlock: GetBlockTimeStampLookup,
    ): SlotInfo {
        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let lastSpanEndTime = 0;
        let previousMilestoneHeight = 1;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");

        for (let i = 0; i < this.getMilestonesWhichAffectBlockTimes().length - 1; i++) {
            if (height < nextMilestone.height) {
                const slotNumerUpUntilThisTimestamp = Math.floor((timestamp - lastSpanEndTime) / blockTime);
                const slotNumber = totalSlotsFromLastSpan + slotNumerUpUntilThisTimestamp;
                const startTime = lastSpanEndTime + slotNumerUpUntilThisTimestamp * blockTime;
                const endTime = startTime + blockTime - 1;
                const forgingStatus = timestamp < startTime + Math.floor(blockTime / 2);

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
        let slotNumber = totalSlotsFromLastSpan + slotNumerUpUntilThisTimestamp - 1;
        const startTime = lastSpanEndTime + slotNumerUpUntilThisTimestamp * blockTime;
        const endTime = startTime + blockTime - 1;
        const forgingStatus = timestamp < startTime + Math.floor(blockTime / 2);

        if (this.getMilestonesWhichAffectBlockTimes().length <= 1) {
            slotNumber++;
        }

        const slotInfo: SlotInfo = {
            blockTime,
            startTime,
            endTime,
            slotNumber,
            forgingStatus,
        };

        return slotInfo;
    }

    public static getMilestonesWhichAffectBlockTimes(): Array<MilestoneSearchResult> {
        const milestones: Array<MilestoneSearchResult> = [
            {
                found: true,
                height: 1,
                data: configManager.getMilestone(1).blocktime,
            },
        ];

        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");

        while (nextMilestone.found) {
            milestones.push(nextMilestone);
            nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
        }

        return milestones;
    }

    private static calculateSlotTime(
        slotNumber: number,
        height: number,
        getTimeStampForBlock: GetBlockTimeStampLookup,
    ): number {
        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");
        let previousSpanEndTimestamp = 0;
        let previousMilestoneHeight = 1;
        let previousMilestoneBlockTime = blockTime;

        for (let i = 0; i < this.getMilestonesWhichAffectBlockTimes().length - 1; i++) {
            if (height < nextMilestone.height) {
                return previousSpanEndTimestamp + (slotNumber - totalSlotsFromLastSpan) * blockTime;
            } else {
                const spanStartTimestamp = getTimeStampForBlock(previousMilestoneHeight);
                previousSpanEndTimestamp = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;

                let spanTotalTime = previousSpanEndTimestamp - spanStartTimestamp;
                if (spanStartTimestamp !== 0) {
                    spanTotalTime -= previousMilestoneBlockTime;
                }
                const totalSlotsInThisSpan = Math.floor(spanTotalTime / blockTime);

                totalSlotsFromLastSpan += totalSlotsInThisSpan;
                previousMilestoneBlockTime = blockTime;
                blockTime = nextMilestone.data;
                previousMilestoneHeight = nextMilestone.height - 1;

                nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
            }
        }

        if (this.getMilestonesWhichAffectBlockTimes().length <= 1) {
            return slotNumber * blockTime;
        }

        return previousSpanEndTimestamp + (slotNumber - totalSlotsFromLastSpan) * blockTime;
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
