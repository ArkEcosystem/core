import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";

export function calculate(height: number): number {
    const { genesisBlock, milestones } = app.getConfig().all();

    if (!height) {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
        height = blockchain ? blockchain.getLastBlock().data.height : 0;
    }

    if (height === 0 || milestones.length === 0) {
        return genesisBlock.totalAmount;
    }

    let rewards: Utils.BigNumber = Utils.BigNumber.ZERO;
    let currentHeight: number = 0;
    let constantIndex: number = 0;

    while (currentHeight < height) {
        const constants = milestones[constantIndex];
        const nextConstants = milestones[constantIndex + 1];

        let heightJump: number = height - currentHeight;

        if (nextConstants && height >= nextConstants.height && currentHeight < nextConstants.height - 1) {
            heightJump = nextConstants.height - 1 - currentHeight;
            constantIndex += 1;
        }

        currentHeight += heightJump;

        if (currentHeight >= constants.height) {
            rewards = rewards.plus(Utils.BigNumber.make(constants.reward).times(heightJump));
        }
    }

    return +Utils.BigNumber.make(genesisBlock.totalAmount)
        .plus(rewards)
        .toFixed();
}
