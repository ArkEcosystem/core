import { app } from "@arkecosystem/core-container";
import { Shared } from "@arkecosystem/core-interfaces";

export const calculateRound = (height: number): Shared.IRoundInfo => {
    const config = app.getConfig();
    const { milestones } = config.config;

    let round = 0;
    let roundHeight = 1;
    let nextRound = 0;
    let maxDelegates = 0;

    let milestoneHeight = height;
    let milestone = null;

    for (let i = 0, j = 0; i < milestones.length; i++) {
        if (!milestone || milestone.activeDelegates !== milestones[i].activeDelegates) {
            milestone = milestones[i];
        }
        maxDelegates = milestone.activeDelegates;

        let delegateCountChanged = false;
        let nextMilestoneHeight = milestone.height;

        for (j = i + 1; j < milestones.length; j++) {
            const nextMilestone = milestones[j];
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
            roundHeight += milestoneHeight;
        }

        if (i === milestones.length - 1 || milestones[i + 1].height > height) {
            const roundIncrease =
                Math.floor((height - nextMilestoneHeight) / maxDelegates) + (delegateCountChanged ? 0 : 1);
            round += roundIncrease;
            roundHeight += (roundIncrease - 1) * maxDelegates;
            nextRound = round + ((height - (nextMilestoneHeight - 1)) % maxDelegates === 0 ? 1 : 0);
            break;
        }

        delegateCountChanged = false;
    }

    return { round, roundHeight, nextRound, maxDelegates };
};

export const isNewRound = (height: number): boolean => {
    const config = app.getConfig();
    const milestone = config.getMilestone(height);
    return height === 1 || (height - milestone.height) % milestone.activeDelegates === 0;
};
