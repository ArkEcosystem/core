import { CryptoError } from "../errors";
import { IBlockHeader, ISlot } from "../interfaces";
import { configManager } from "../managers";

export class Slots {
    public static getBlockchainTimestamp(date: Date): number {
        const epoch = new Date(configManager.getMilestone().epoch);
        const miliseconds = date.getTime() - epoch.getTime();

        return Math.floor(miliseconds / 1000);
    }

    public static getSystemDate(timestamp: number): Date {
        const epoch = new Date(configManager.getMilestone().epoch);
        const miliseconds = epoch.getTime() + timestamp * 1000;

        return new Date(miliseconds);
    }

    public static getGenesisSlot(): ISlot {
        return { no: 0, timestamp: 0 };
    }

    public static getSubsequentSlot(
        lastHeight: number,
        lastSlot: ISlot,
        subseqHeight: number,
        subseqTimestamp: number,
    ): ISlot {
        if (subseqHeight < lastHeight) {
            throw new CryptoError("Invalid subsequent height.");
        }

        const lastMilestone = configManager.getMilestone(lastHeight);
        const subseqMilestone = configManager.getMilestone(subseqHeight);

        if (lastMilestone.height !== subseqMilestone.height) {
            for (const milestone of configManager.getMilestones()) {
                if (milestone.height <= lastMilestone.height) continue;
                if (milestone.height === subseqMilestone.height) break;

                if (milestone.blocktime !== lastMilestone.blocktime) {
                    throw new CryptoError(`Block time changed.`);
                }
            }
        }

        const delta = Math.floor((subseqTimestamp - lastSlot.timestamp) / lastMilestone.blocktime);
        const no = lastSlot.no + delta;
        const timestamp = lastSlot.timestamp + delta * lastMilestone.blocktime;

        return { no, timestamp };
    }

    public static getLastBlockSlot(blocks: readonly IBlockHeader[]): ISlot {
        let slot = this.getGenesisSlot();
        let height = 1;

        for (const block of blocks) {
            slot = this.getSubsequentSlot(height, slot, block.height, block.timestamp);
            height = block.height;
        }

        return slot;
    }
}
