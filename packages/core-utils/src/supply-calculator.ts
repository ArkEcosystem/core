import { app, Contracts } from "@arkecosystem/core-kernel";
import { Bignum } from "@arkecosystem/crypto";

/**
 * Calculate the total supply at the given height
 * @param  {Number} height
 * @return {Number}
 */
function calculate(height) {
    const { genesisBlock, milestones } = app.getConfig().all();

    if (!height) {
        height = app.blockchain ? app.blockchain.getLastBlock().data.height : 0;
    }

    if (height === 0 || milestones.length === 0) {
        return genesisBlock.totalAmount;
    }

    let rewards = Bignum.ZERO;
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
            rewards = rewards.plus(new Bignum(constants.reward).times(heightJump));
        }
    }

    return +new Bignum(genesisBlock.totalAmount).plus(rewards).toFixed();
}

export { calculate };
