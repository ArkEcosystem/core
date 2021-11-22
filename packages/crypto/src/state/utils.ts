import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockHeader, IRound, ISlot } from "../interfaces";
import { configManager } from "../managers";

type Milestone = {
    height: number;
    activeDelegates: number;
    blocktime: number;
};

export class Utils {
    public static getRoundHeight(no: number): number {
        throw new Error("Not implementd");
    }

    public static getRoundNo(height: number): number {
        const genesisMilestone = configManager.getMilestone(1) as Milestone;
        const otherMilestones = configManager.getMilestones().slice(1) as Milestone[];

        let prevMilestone = genesisMilestone;
        let prevMilestoneRoundNo = 1;

        for (const milestone of otherMilestones.slice(1)) {
            if (milestone.height > height) break;
            if (milestone.activeDelegates === prevMilestone.activeDelegates) continue;

            const heights = milestone.height - prevMilestone.height;
            const rounds = heights / prevMilestone.activeDelegates;

            if (Number.isInteger(rounds) === false) {
                throw new CryptoError(`Invalid milestone.`);
            }

            prevMilestone = milestone;
            prevMilestoneRoundNo += rounds;
        }

        const heights = height - prevMilestone.height;
        const rounds = heights / prevMilestone.activeDelegates;

        return prevMilestoneRoundNo + Math.floor(rounds);
    }

    public static getRoundForgers(round: IRound): string[] {
        const forgers = round.delegates.slice();
        let seed = HashAlgorithms.sha256(round.no.toString());

        for (let i = 0; i < forgers.length; i++) {
            for (const s of seed.slice(0, Math.min(forgers.length - i, 4))) {
                const index = s % forgers.length;
                const t = forgers[index];
                forgers[index] = forgers[i];
                forgers[i] = t;
                i++;
            }

            seed = HashAlgorithms.sha256(seed);
        }

        return forgers;
    }

    public static getNextForgers(forgers: readonly string[], slotDiff: number): string[] {
        const index = slotDiff % forgers.length;
        return [...forgers.slice(index), ...forgers.slice(0, index)];
    }

    public static getNewSlot(lastSlot: ISlot, newHeight: number, newTimestamp: number): ISlot {
        const lastMilestone = configManager.getMilestone(lastSlot.height) as Milestone;

        const blocktimeMilestones = configManager
            .getMilestones()
            .filter((milestone: Milestone) => milestone.height > lastSlot.height)
            .filter((milestone: Milestone) => milestone.height < newHeight)
            .filter((milestone: Milestone) => milestone.blocktime !== lastMilestone.blocktime);

        if (blocktimeMilestones.length !== 0) {
            throw new CryptoError(`Block time changed in-between.`);
        }

        const diff = Math.floor((newTimestamp - lastSlot.timestamp) / lastMilestone.blocktime);
        const no = lastSlot.no + diff;
        const timestamp = lastSlot.timestamp + diff * lastMilestone.blocktime;

        return { no, timestamp, height: newHeight };
    }

    public static getValidators(finalizedRound: IRound, nextRound: IRound): string[] {
        const trusted = finalizedRound.delegates.slice().sort();
        const pending = nextRound.delegates.filter((key) => trusted.includes(key) === false).sort();

        return [...trusted, ...pending];
    }
}
