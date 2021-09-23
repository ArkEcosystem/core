"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const assert_1 = __importDefault(require("assert"));
exports.isNewRound = (height) => {
    const { config } = core_container_1.app.getConfig();
    // Since milestones are merged, find the first milestone to introduce the delegate count.
    let milestone;
    for (let i = config.milestones.length - 1; i >= 0; i--) {
        const temp = config.milestones[i];
        if (temp.height > height) {
            continue;
        }
        if (!milestone || temp.activeDelegates === milestone.activeDelegates) {
            milestone = temp;
        }
        else {
            break;
        }
    }
    return height === 1 || (height - milestone.height) % milestone.activeDelegates === 0;
};
exports.calculateRound = (height) => {
    const config = core_container_1.app.getConfig();
    const { milestones } = config.config;
    let round = 0;
    let roundHeight = 1;
    let nextRound = 0;
    let maxDelegates = 0;
    let milestoneHeight = height;
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
            if (nextMilestone.activeDelegates !== milestone.activeDelegates &&
                nextMilestone.height > milestone.height) {
                assert_1.default(exports.isNewRound(nextMilestone.height));
                delegateCountChanged = true;
                maxDelegates = nextMilestone.activeDelegates;
                milestoneHeight = nextMilestone.height - milestone.height;
                nextMilestoneHeight = nextMilestone.height;
                i = j - 1;
                break;
            }
        }
        if (delegateCountChanged) {
            assert_1.default(milestoneHeight % milestone.activeDelegates === 0);
            round += milestoneHeight / milestone.activeDelegates;
            roundHeight += milestoneHeight;
        }
        if (i === milestones.length - 1 || milestones[i + 1].height > height) {
            const roundIncrease = Math.floor((height - nextMilestoneHeight) / maxDelegates) + (delegateCountChanged ? 0 : 1);
            round += roundIncrease;
            roundHeight += (roundIncrease - 1) * maxDelegates;
            nextRound = round + ((height - (nextMilestoneHeight - 1)) % maxDelegates === 0 ? 1 : 0);
            break;
        }
        delegateCountChanged = false;
    }
    return { round, roundHeight, nextRound, maxDelegates };
};
//# sourceMappingURL=round-calculator.js.map