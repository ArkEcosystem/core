import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";

import { assert } from "./assert";

// todo: review the implementation
export const calculate = (height: number): string => {
    const config: Interfaces.NetworkConfig | undefined = Managers.configManager.all();

    assert.defined<Interfaces.NetworkConfig>(config);

    const { genesisBlock, milestones } = config;

    const totalAmount: Utils.BigNumber = Utils.BigNumber.make(genesisBlock.totalAmount);

    if (height === 0 || milestones.length === 0) {
        return totalAmount.toFixed();
    }

    let rewards: Utils.BigNumber = Utils.BigNumber.ZERO;
    let currentHeight = 0;
    let constantIndex = 0;

    while (currentHeight < height) {
        const milestone = milestones[constantIndex];
        const nextMilestone = milestones[constantIndex + 1];

        let heightJump: number = height - currentHeight;

        if (nextMilestone && height >= nextMilestone.height && currentHeight < nextMilestone.height - 1) {
            heightJump = nextMilestone.height - 1 - currentHeight;
            constantIndex += 1;
        }

        currentHeight += heightJump;

        if (currentHeight >= milestone.height) {
            rewards = rewards.plus(Utils.BigNumber.make(milestone.reward).times(heightJump));
        }
    }

    return totalAmount.plus(rewards).toFixed();
};
