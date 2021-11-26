import { CryptoError } from "../errors";
import { IBlockHeader, ISlot, IState } from "../interfaces";
import { configManager } from "../managers";

export class Slots {
    public static getGenesisSlot(): ISlot {
        return { no: 0, timestamp: 0, duration: configManager.getMilestone(1).blocktime };
    }

    public static getNextBlockSlot({ lastBlock, lastSlot }: IState, nextBlockTimestamp: number): ISlot {
        const seconds = nextBlockTimestamp - lastSlot.timestamp;
        const slots = Math.floor(seconds / lastSlot.duration);

        return {
            no: lastSlot.no + slots,
            timestamp: lastSlot.timestamp + slots * lastSlot.duration,
            duration: configManager.getMilestone(lastBlock.height + 1).blocktime,
        };
    }

    public static bootstrapSlot(blocks: readonly IBlockHeader[]): ISlot {
        const milestones = configManager.getMilestones().slice(1);
        const slot = { ...this.getGenesisSlot() };

        for (const block of blocks) {
            while (milestones[0]?.height < block.height) {
                if (milestones.shift().blocktime !== slot.duration) {
                    throw new CryptoError(`Missing required bootstrap block.`);
                }
            }

            const timestampDelta = block.timestamp - slot.timestamp;
            const slotNoChange = Math.floor(timestampDelta / slot.duration);
            const slotTimestampChange = slotNoChange * slot.duration;

            slot.no += slotNoChange;
            slot.timestamp += slotTimestampChange;

            if (milestones[0]?.height === block.height) {
                slot.duration = milestones[0].blocktime;
            }
        }

        return slot;
    }

    public static getBlocktimeHeights(): number[] {
        let blocktime = configManager.getMilestone(1).blocktime;
        const milestones = configManager.getMilestones().slice(1);
        const heights: number[] = [];

        for (const milestone of milestones) {
            if (milestone.blocktime !== blocktime) {
                heights.push(milestone.height);
                blocktime = milestone.blocktime;
            }
        }

        return heights;
    }

    public static getBlockchainTimestamp(date: Date): number {
        const genesisMilestone = configManager.getMilestone(1);
        const epoch = new Date(genesisMilestone.epoch);
        const milliseconds = date.getTime() - epoch.getTime();

        return Math.floor(milliseconds / 1000);
    }

    public static getSystemDate(timestamp: number): Date {
        const genesisMilestone = configManager.getMilestone(1);
        const epoch = new Date(genesisMilestone.epoch);
        const milliseconds = epoch.getTime() + timestamp * 1000;

        return new Date(milliseconds);
    }
}
