import { GetBlockTimeStampLookup, SlotInfo } from "../interfaces";
import { Libraries } from "../interfaces/libraries";
import { HeightTracker } from "../managers";
import { MilestoneManager, MilestoneSearchResult } from "../managers/milestone-manager";
import { calculateBlockTime } from "../utils/block-time-calculator";

export class Slots<T> {
    public constructor(
        private libraries: Libraries,
        private milestoneManager: MilestoneManager<T>,
        private heightTracker: HeightTracker,
    ) {}

    public getTime(time?: number): number {
        if (time === undefined) {
            time = this.libraries.dayjs().valueOf();
        }

        const start: number = this.libraries.dayjs(this.milestoneManager.getMilestone(1).epoch).valueOf();

        // @ts-ignore TODO: use assert here
        return Math.floor((time - start) / 1000);
    }

    public getTimeInMsUntilNextSlot(getTimeStampForBlock: GetBlockTimeStampLookup): number {
        const nextSlotTime: number = this.getSlotTime(getTimeStampForBlock, this.getNextSlot(getTimeStampForBlock));
        const now: number = this.getTime();

        return (nextSlotTime - now) * 1000;
    }

    public getSlotNumber(getTimeStampForBlock: GetBlockTimeStampLookup, timestamp?: number, height?: number): number {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        const latestHeight = this.getLatestHeight(height);

        return this.getSlotInfo(getTimeStampForBlock, timestamp, latestHeight).slotNumber;
    }

    public getSlotTime(getTimeStampForBlock: GetBlockTimeStampLookup, slot: number, height?: number): number {
        const latestHeight = this.getLatestHeight(height);

        return this.calculateSlotTime(slot, latestHeight, getTimeStampForBlock);
    }

    public getNextSlot(getTimeStampForBlock: GetBlockTimeStampLookup): number {
        return this.getSlotNumber(getTimeStampForBlock) + 1;
    }

    public isForgingAllowed(
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

    public getSlotInfo(getTimeStampForBlock: GetBlockTimeStampLookup, timestamp?: number, height?: number): SlotInfo {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }

        height = this.getLatestHeight(height);

        let blockTime = calculateBlockTime(1, this.milestoneManager.getMilestones());
        let totalSlotsFromLastSpan = 0;
        let lastSpanEndTime = 0;
        let previousMilestoneHeight = 1;
        let nextMilestone = this.milestoneManager.getNextMilestoneWithNewKey(1, "blocktime");

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
                nextMilestone = this.milestoneManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
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

    public getMilestonesWhichAffectBlockTimes(): Array<MilestoneSearchResult> {
        const milestones: Array<MilestoneSearchResult> = [
            {
                found: true,
                height: 1,
                data: this.milestoneManager.getMilestone(1).blocktime,
            },
        ];

        let nextMilestone = this.milestoneManager.getNextMilestoneWithNewKey(1, "blocktime");

        while (nextMilestone.found) {
            milestones.push(nextMilestone);
            nextMilestone = this.milestoneManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
        }

        return milestones;
    }

    private calculateSlotTime(
        slotNumber: number,
        height: number,
        getTimeStampForBlock: GetBlockTimeStampLookup,
    ): number {
        let blockTime = calculateBlockTime(1, this.milestoneManager.getMilestones());
        let totalSlotsFromLastSpan = 0;
        let nextMilestone = this.milestoneManager.getNextMilestoneWithNewKey(1, "blocktime");
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

                nextMilestone = this.milestoneManager.getNextMilestoneWithNewKey(nextMilestone.height, "blocktime");
            }
        }

        if (this.getMilestonesWhichAffectBlockTimes().length <= 1) {
            return slotNumber * blockTime;
        }

        return previousSpanEndTimestamp + (slotNumber - totalSlotsFromLastSpan) * blockTime;
    }

    private getLatestHeight(height: number | undefined): number {
        if (!height) {
            // TODO: is the config manager the best way to retrieve most recent height?
            // Or should this class maintain its own cache?
            const configConfiguredHeight = this.heightTracker.getHeight();
            if (configConfiguredHeight) {
                return configConfiguredHeight;
            } else {
                return 1;
            }
        }

        return height;
    }
}
