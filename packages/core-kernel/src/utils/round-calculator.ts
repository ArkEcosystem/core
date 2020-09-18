import { Errors, Managers } from "@arkecosystem/crypto";
import { RoundInfo } from "../contracts/shared";
import { getMilestonesWhichAffectActiveDelegateCount } from "./calculate-forging-info";

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
    const result: RoundInfo = {
        round: 1,
        roundHeight: 1,
        nextRound: 0,
        maxDelegates: 0,
    };

    let nextMilestone = Managers.configManager.getNextMilestoneWithNewKey(1, "activeDelegates");
    let activeDelegates = Managers.configManager.getMilestone(1).activeDelegates;
    let milestoneHeight = 1;

    const milestones = getMilestonesWhichAffectActiveDelegateCount();

    for (let i = 0; i < milestones.length - 1; i++) {
        if (height < nextMilestone.height) {
            break;
        }

        const spanHeight = nextMilestone.height - milestoneHeight;
        if (spanHeight % activeDelegates !== 0) {
            throw new Errors.InvalidMilestoneConfigurationError(
                `Bad milestone at height: ${height}. The number of delegates can only be changed at the beginning of a new round.`,
            );
        }

        result.round += spanHeight / activeDelegates;
        result.roundHeight = nextMilestone.height;
        result.maxDelegates = nextMilestone.data;

        activeDelegates = nextMilestone.data;
        milestoneHeight = nextMilestone.height;

        nextMilestone = Managers.configManager.getNextMilestoneWithNewKey(nextMilestone.height, "activeDelegates");
    }

    const heightFromLastSpan = height - milestoneHeight;
    const roundIncrease = Math.floor(heightFromLastSpan / activeDelegates);
    const nextRoundIncrease = (heightFromLastSpan + 1) % activeDelegates === 0 ? 1 : 0;

    result.round += roundIncrease;
    result.roundHeight += roundIncrease * activeDelegates;
    result.nextRound = result.round + nextRoundIncrease;
    result.maxDelegates = activeDelegates;

    return result;
};
