import { Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import assert from "assert";

export const isNewRound = (height: number): boolean => {
    const milestones = Managers.configManager.get("milestones");

    // Since milestones are merged, find the first milestone to introduce the delegate count.
    let milestone;
    for (let i = milestones.length - 1; i >= 0; i--) {
        const temp = milestones[i];
        if (temp.height > height) {
            continue;
        }

        if (!milestone || temp.activeDelegates === milestone.activeDelegates) {
            milestone = temp;
        } else {
            break;
        }
    }

    return height === 1 || (height - milestone.height) % milestone.activeDelegates === 0;
};

export const calculateRound = (height: number): Contracts.Shared.IRoundInfo => {
    const milestones = Managers.configManager.get("milestones");

    let round: number = 0;
    let roundHeight: number = 1;
    let nextRound: number = 0;
    let maxDelegates: number = 0;

    let milestoneHeight: number = height;
    let milestone;

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
                assert(isNewRound(nextMilestone.height));
                delegateCountChanged = true;
                maxDelegates = nextMilestone.activeDelegates;
                milestoneHeight = nextMilestone.height - milestone.height;
                nextMilestoneHeight = nextMilestone.height;
                i = j - 1;
                break;
            }
        }

        if (delegateCountChanged) {
            assert(milestoneHeight % milestone.activeDelegates === 0);
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
