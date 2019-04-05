import { app } from "@arkecosystem/core-container";

interface IActiveDelegateMilestone {
    activeDelegates: number;
    height: number;
}

export const calculateRound = (height: number): { round: number; nextRound: number; maxDelegates: number } => {
    const config = app.getConfig();

    let round = 0;
    let nextRound = 0;
    let maxDelegates = 0;

    let milestoneHeight = height;
    let milestone = null;

    for (let i = 0, j = 0; i < config.milestones.length; i++) {
        if (!milestone || milestone.activeDelegates !== config.milestones[i].activeDelegates) {
            milestone = config.milestones[i];
        }
        maxDelegates = milestone.activeDelegates;

        let delegateCountChanged = false;
        let nextMilestoneHeight = milestone.height;

        for (j = i + 1; j < config.milestones.length; j++) {
            const nextMilestone = config.milestones[j];
            if (nextMilestone.height > height) {
                break;
            }

            if (
                nextMilestone.activeDelegates !== milestone.activeDelegates &&
                nextMilestone.height > milestone.height
            ) {
                console.assert(isNewRound(nextMilestone.height));
                delegateCountChanged = true;
                maxDelegates = nextMilestone.activeDelegates;
                milestoneHeight = nextMilestone.height - milestone.height;
                nextMilestoneHeight = nextMilestone.height;
                i = j - 1;
                break;
            }
        }

        if (delegateCountChanged) {
            console.assert(milestoneHeight % milestone.activeDelegates === 0);
            round += milestoneHeight / milestone.activeDelegates;
        }

        if (i === config.milestones.length - 1 || config.milestones[i + 1].height > height) {
            round += Math.floor((height - nextMilestoneHeight) / maxDelegates) + (delegateCountChanged ? 0 : 1);

            nextRound = round + ((height - (nextMilestoneHeight - 1)) % maxDelegates === 0 ? 1 : 0);
            break;
        }

        delegateCountChanged = false;
    }

    return { round, nextRound, maxDelegates };
};

export const isNewRound = (height: number): boolean => {
    const config = app.getConfig();

    const nextMilestone = config.getMilestone(height);
    const milestone = getPreviousDelegateMilestone(height);

    // The delegate count can only change at the beginning of a new round.
    if (
        height === 1 ||
        (height === nextMilestone.height && nextMilestone.activeDelegates !== milestone.activeDelegates)
    ) {
        return true;
    }

    // Offset height relative to previous milestone and delegate count
    if (height > milestone.activeDelegates && milestone.height !== nextMilestone.height) {
        height -= nextMilestone.activeDelegates;
        if (height >= milestone.height) {
            height -= milestone.height;
        }
        //   console.info(`Normalizing height to: ${height}`);
    } else {
        height -= 1; // The first round is special, because the height is initially below the delegate count.
    }

    // console.info(`${height}%${nextMilestone.activeDelegates} === ${height % nextMilestone.activeDelegates}`);
    return height % nextMilestone.activeDelegates === 0;
};

/**
 * Given the following milestones:
 * [
 *   { height: 1, activeDelegates: 2 }, // M1
 *   { height: 2, activeDelegates: 2 }, // M2
 *   { height: 3, activeDelegates: 3 }, // M3
 *   { height: 4, activeDelegates: 3 }, // M4
 *   { height: 5, activeDelegates: 3 }, // M5
 *   { height: 6, activeDelegates: 9 }, // M6
 *   { height: 15, activeDelegates: 51 }, // M15
 *   { height: 66, activeDelegates: 1 }, // M66
 * ]
 *
 * For `height = 6` the active milestone will be `M6`.
 * In order to correctly determine if it's the beginning of a new round
 * the previous milestone is required.
 *
 * By just looking at `height = 6` and `activeDelegates = 9` it would not
 * be possible to say if it's the beginning of a round without knowing the active
 * delegate count prior `M6`.
 *
 * The loop basically goes through all milestones in ascending order and looks for
 * the last active milestone with at least 1 round distance to the current milestone
 * for the given height. In this case the previous delegate count was `3`.
 *
 * Out of `M3`, `M4`and `M5` the loop returns `M3` since there's exactly 1 round distance.
 *
 * Or in other words:
 * From `M3`'s point of view `M6` is the beginning of a new round:
 * `M6.height - M3.height % M3.activeDelegates === 0`
 */
const getPreviousDelegateMilestone = (height: number): IActiveDelegateMilestone => {
    const config = app.getConfig();
    const milestones: IActiveDelegateMilestone[] = config.milestones.filter(
        ({ activeDelegates, height }: IActiveDelegateMilestone) => {
            return activeDelegates !== undefined && height !== undefined;
        },
    );

    if (milestones.length === 0) {
        throw new Error("Missing delegate milestone configuration.");
    }

    let previousMilestone = milestones[0];
    //  console.info(`Previous milestone ${JSON.stringify(previousMilestone)}`);

    for (;;) {
        const milestone = milestones.find(
            milestone =>
                milestone.height > previousMilestone.height &&
                milestone.height < height &&
                milestone.activeDelegates !== previousMilestone.activeDelegates &&
                (milestone.height - previousMilestone.height) % previousMilestone.activeDelegates === 0,
        );

        //    console.info(`${JSON.stringify(milestone)}`);
        if (milestone) {
            previousMilestone = milestone;
        } else {
            break;
        }
    }

    return previousMilestone as IActiveDelegateMilestone;
};
