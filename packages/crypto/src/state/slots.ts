import { CryptoError } from "../errors";
import { IBlock, ISlot } from "../interfaces";
import { configManager } from "../managers";

type Milestone = {
    readonly height: number;
    readonly blocktime: number;
};

export class Slots {
    public static getGenesisSlot(): ISlot {
        return { no: 0, timestamp: 0, height: 1 };
    }

    public static getFutureSlot(prevSlot: ISlot, block: Pick<IBlock, "height" | "timestamp">): ISlot {
        const prevMilestone = configManager.getMilestone(prevSlot.height) as Milestone;
        const laterMilestone = configManager.getMilestone(block.height) as Milestone;

        if (prevMilestone.height !== laterMilestone.height) {
            for (const milestone of configManager.getMilestones() as Milestone[]) {
                if (milestone.height <= prevMilestone.height) continue;
                if (milestone.height === laterMilestone.height) break;

                if (milestone.blocktime !== prevMilestone.blocktime) {
                    throw new CryptoError(`Block time changed.`);
                }
            }
        }

        const delta = Math.floor((block.timestamp - prevSlot.timestamp) / prevMilestone.blocktime);
        const no = prevSlot.no + delta;
        const timestamp = prevSlot.timestamp + delta * prevMilestone.blocktime;
        const height = block.height;

        return { no, timestamp, height };
    }

    public static getSlot(blocks: Pick<IBlock, "height" | "timestamp">[]): ISlot {
        let slot = this.getGenesisSlot();

        for (const block of blocks) {
            slot = this.getFutureSlot(slot, block);
        }

        return slot;
    }
}
