import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { configManager } from "../managers";

export class Rounds {
    public static getRound(height: number): number {
        const genesisMilestone = configManager.getMilestone(1);
        const otherMilestones = configManager.getMilestones().slice(1);

        let prevMilestone = genesisMilestone;
        let prevMilestoneRoundNo = 1;

        for (const milestone of otherMilestones.slice(1)) {
            if (milestone.height > height) break;
            if (milestone.activeDelegates === prevMilestone.activeDelegates) continue;

            const length = milestone.height - prevMilestone.height;

            if (length % prevMilestone.activeDelegates !== 0) {
                throw new CryptoError(`Invalid milestone.`);
            }

            prevMilestone = milestone;
            prevMilestoneRoundNo += length / prevMilestone.activeDelegates;
        }

        const heights = height - prevMilestone.height;
        const rounds = heights / prevMilestone.activeDelegates;

        return prevMilestoneRoundNo + Math.floor(rounds);
    }

    public static getShuffledDelegates(round: number, delegatePublicKeys: readonly string[]): string[] {
        const generatorPublicKeys = delegatePublicKeys.slice();
        let seed = HashAlgorithms.sha256(round.toString());

        for (let i = 0; i < generatorPublicKeys.length; i++) {
            for (const s of seed.slice(0, Math.min(generatorPublicKeys.length - i, 4))) {
                const index = s % generatorPublicKeys.length;
                const t = generatorPublicKeys[index];
                generatorPublicKeys[index] = generatorPublicKeys[i];
                generatorPublicKeys[i] = t;
                i++;
            }

            seed = HashAlgorithms.sha256(seed);
        }

        return generatorPublicKeys;
    }
}
