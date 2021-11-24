import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { configManager } from "../managers";

type Milestone = {
    readonly height: number;
    readonly activeDelegates: number;
};

export class Rounds {
    public static getRound(height: number): number {
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

    public static getRoundForgers(round: number, delegates: readonly string[]): string[] {
        const forgers = delegates.slice();
        let seed = HashAlgorithms.sha256(round.toString());

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
}
