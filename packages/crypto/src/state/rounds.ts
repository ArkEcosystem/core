import { IRound, IState } from "../interfaces";
import { configManager } from "../managers";

export class Rounds {
    public static getGenesisRound(): IRound {
        return { no: 1, height: 1, length: configManager.getMilestone(1).activeDelegates };
    }

    public static getNextBlockRound(prevState: IState): IRound {
        const nextRoundHeight = prevState.lastRound.height + prevState.lastRound.length;
        const nextBlockHeight = prevState.lastBlock.height + 1;

        if (nextRoundHeight !== nextBlockHeight) {
            return prevState.lastRound;
        }

        const nextBlockRound = {
            no: prevState.lastRound.no + 1,
            height: nextRoundHeight,
            length: configManager.getMilestone(nextBlockHeight).activeDelegates,
        };

        return nextBlockRound;
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
