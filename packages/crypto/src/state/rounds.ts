import { IHeaderState, IRound } from "../interfaces";
import { configManager } from "../managers";

export class Rounds {
    public static getGenesisRound(): IRound {
        return { no: 1, height: 1, length: configManager.getMilestone(1).activeDelegates };
    }

    public static getNextBlockRound(lastState: IHeaderState): IRound {
        const nextRoundHeight = lastState.round.height + lastState.round.length;
        const nextBlockHeight = lastState.height + 1;

        if (nextRoundHeight !== nextBlockHeight) {
            return lastState.round;
        }

        const round = { ...lastState.round };
        round.no += 1;
        round.height += round.length;
        round.length = configManager.getMilestone(round.height).activeDelegates;

        return round;
    }

    public static bootstrapRound(height: number): IRound {
        const milestones = configManager.getMilestones().slice(1);
        const round = { ...this.getGenesisRound() };

        for (const milestone of milestones) {
            if (milestone.height > height) break;
            if (milestone.activeDelegates === round.length) continue;

            const heightDelta = milestone.height - round.height;
            const roundNoChange = Math.floor(heightDelta / round.length);
            const roundHeightChange = roundNoChange * round.length;

            if (roundHeightChange !== heightDelta) {
                throw new Error();
            }

            round.no += roundNoChange;
            round.height += roundHeightChange;
            round.length = milestone.activeDelegates;
        }

        const heightDelta = height - round.height;
        const roundNoChange = Math.floor(heightDelta / round.length);
        const roundHeightChange = roundNoChange * round.length;

        round.no += roundNoChange;
        round.height += roundHeightChange;

        return round;
    }
}
