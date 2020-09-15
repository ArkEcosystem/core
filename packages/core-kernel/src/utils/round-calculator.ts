import { Managers } from "@arkecosystem/crypto";
import assert from "assert";

import { RoundInfo } from "../contracts/shared";

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

export const calculateRound = (height: number): RoundInfo => {
    const milestones = Managers.configManager.get("milestones");

    const result: RoundInfo = {
        round: 0,
        roundHeight: 1,
        nextRound: 0,
        maxDelegates: 0,
    };

    let milestone;

    for (let i = 0, j = 0; i < milestones.length; i++) {
        if (!milestone || milestone.activeDelegates !== milestones[i].activeDelegates) {
            milestone = milestones[i];
        }

        result.maxDelegates = milestone.activeDelegates;

        let nextMilestoneHeight = milestone.height;

        // Find next milestone that introduces delegate count change
        for (j = i + 1; j < milestones.length; j++) {
            const nextMilestone = milestones[j];
            if (nextMilestone.height > height) {
                break;
            }

            // If delegate count changed
            if (nextMilestone.activeDelegates !== milestone.activeDelegates) {
                assert(isNewRound(nextMilestone.height));
                const milestoneHeight = nextMilestone.height - milestone.height;
                assert(milestoneHeight % milestone.activeDelegates === 0);

                result.maxDelegates = nextMilestone.activeDelegates;
                result.round += milestoneHeight / milestone.activeDelegates;
                result.roundHeight += milestoneHeight;

                nextMilestoneHeight = nextMilestone.height;
                i = j - 1;

                break;
            }
        }

        // If reached last relevant milestone
        if (i === milestones.length - 1 || milestones[i + 1].height > height) {
            const roundIncrease =
                Math.floor((height - nextMilestoneHeight) / result.maxDelegates) + 1;

            const nextRoundIncrease = (height - (nextMilestoneHeight - 1)) % result.maxDelegates === 0 ? 1 : 0;

            result.round += roundIncrease;
            result.roundHeight += (roundIncrease - 1) * result.maxDelegates;
            result.nextRound = result.round + nextRoundIncrease;

            break;
        }
    }

    return result;
};
