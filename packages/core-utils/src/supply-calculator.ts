import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";

export function calculate(height: number) {
    const { genesisBlock, milestones } = app.getConfig().all();

    if (!height) {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
        height = blockchain ? blockchain.getLastBlock().data.height : 0;
    }

    if (height === 0 || milestones.length === 0) {
        return genesisBlock.totalAmount;
    }

    let rewards = Utils.Bignum.ZERO;
    let currentHeight = 0;
    let constantIndex = 0;

    while (currentHeight < height) {
        const constants = milestones[constantIndex];
        const nextConstants = milestones[constantIndex + 1];

        let heightJump = 0;
        if (nextConstants && height >= nextConstants.height && currentHeight < nextConstants.height - 1) {
            heightJump = nextConstants.height - 1 - currentHeight;
            constantIndex += 1;
        } else {
            heightJump = height - currentHeight;
        }

        currentHeight += heightJump;

        if (currentHeight >= constants.height) {
            rewards = rewards.plus(new Utils.Bignum(constants.reward).times(heightJump));
        }
    }

    // @TODO: return bignum or string
    return +new Utils.Bignum(genesisBlock.totalAmount).plus(rewards).toFixed();
}
