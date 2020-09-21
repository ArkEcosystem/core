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

        return this.getSlotInfo(getTimeStampForBlock, timestamp, latestHeight).slotNumber;
    }

    public static getSlotTime(getTimeStampForBlock: GetBlockTimeStampLookup, slot: number, height?: number): number {
        const latestHeight = this.getLatestHeight(height);

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

        return this.getSlotInfo(getTimeStampForBlock, timestamp, latestHeight).forgingStatus;
    }

    public static getSlotInfo(
        getTimeStampForBlock: GetBlockTimeStampLookup,
        timestamp?: number,
        height?: number,
    ): SlotInfo {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        height = this.getLatestHeight(height);

        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let lastSpanEndTime = 0;
        let previousMilestoneHeight = 1;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");

        for (let i = 0; i < this.getMilestonesWhichAffectBlockTimes().length - 1; i++) {
            if (height < nextMilestone.height) {
                break;
            }

            const spanStartTimestamp = getTimeStampForBlock(previousMilestoneHeight);
            lastSpanEndTime = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;
            totalSlotsFromLastSpan += Math.floor((lastSpanEndTime - spanStartTimestamp) / blockTime);

            blockTime = nextMilestone.data;
            previousMilestoneHeight = nextMilestone.height;
            nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
        }

        const slotNumberUpUntilThisTimestamp = Math.floor((timestamp - lastSpanEndTime) / blockTime);
        const slotNumber = totalSlotsFromLastSpan + slotNumberUpUntilThisTimestamp;
        const startTime = lastSpanEndTime + slotNumberUpUntilThisTimestamp * blockTime;
        const endTime = startTime + blockTime - 1;
        const forgingStatus = timestamp < startTime + Math.floor(blockTime / 2);

        return {
            blockTime,
            startTime,
            endTime,
            slotNumber,
            forgingStatus,
        };
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
        let milestoneHeight = 1;
        let lastSpanEndTime = 0;

        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blocktime");

        for (let i = 0; i < this.getMilestonesWhichAffectBlockTimes().length - 1; i++) {
            if (height < nextMilestone.height) {
                break;
            }

            const spanStartTimestamp = getTimeStampForBlock(milestoneHeight);
            lastSpanEndTime = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;
            totalSlotsFromLastSpan += Math.floor((lastSpanEndTime - spanStartTimestamp) / blockTime);

            blockTime = nextMilestone.data;
            milestoneHeight = nextMilestone.height;
            nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
        }

        return lastSpanEndTime + (slotNumber - totalSlotsFromLastSpan) * blockTime;
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
