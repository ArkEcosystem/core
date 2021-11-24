import { CryptoError } from "../errors";
import { IBlock, ISlot } from "../interfaces";
import { configManager } from "../managers";

export class Slots {
    public static getDateTimestamp(date: Date): number {
        const epoch = new Date(configManager.getMilestone().epoch);
        const miliseconds = date.getTime() - epoch.getTime();
        const timestamp = Math.floor(miliseconds / 1000);

        return timestamp;
    }

    public static getTimestampDate(timestamp: number): Date {
        const epoch = new Date(configManager.getMilestone().epoch);
        const miliseconds = epoch.getTime() + timestamp * 1000;
        const date = new Date(miliseconds);

        return date;
    }

    public static getGenesisSlot(): ISlot {
        return { no: 0, timestamp: 0, height: 1 };
    }

    public static getLaterSlot(prevSlot: ISlot, laterBlock: Pick<IBlock, "height" | "timestamp">): ISlot {
        const prevMilestone = configManager.getMilestone(prevSlot.height);
        const laterMilestone = configManager.getMilestone(laterBlock.height);

        if (prevMilestone.height !== laterMilestone.height) {
            for (const milestone of configManager.getMilestones()) {
                if (milestone.height <= prevMilestone.height) continue;
                if (milestone.height === laterMilestone.height) break;

                if (milestone.blocktime !== prevMilestone.blocktime) {
                    throw new CryptoError(`Block time changed.`);
                }
            }
        }

        const delta = Math.floor((laterBlock.timestamp - prevSlot.timestamp) / prevMilestone.blocktime);
        const no = prevSlot.no + delta;
        const timestamp = prevSlot.timestamp + delta * prevMilestone.blocktime;
        const height = laterBlock.height;

        return { no, timestamp, height };
    }

    public static getSlot(blocks: Pick<IBlock, "height" | "timestamp">[]): ISlot {
        let slot = this.getGenesisSlot();

        for (const block of blocks) {
            slot = this.getLaterSlot(slot, block);
        }

        return slot;
    }
}
