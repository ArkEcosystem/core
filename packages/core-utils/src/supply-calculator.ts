import { app } from "@arkecosystem/core-container";
import { Bignum } from "@arkecosystem/crypto";

/**
 * Calculate the total supply at the given height
 * @param  {Number} height
 * @return {Number}
 */
function calculate(height) {
    const config = app.resolvePlugin("config");
    const network = config.network;

    if (!height) {
        const blockchain = app.resolvePlugin("blockchain");
        height = blockchain ? blockchain.getLastBlock().data.height : 0;
    }

    if (height === 0 || network.constants.length === 0) {
        return config.genesisBlock.totalAmount;
    }

    let rewards = Bignum.ZERO;
    let currentHeight = 0;
    let constantIndex = 0;

    while (currentHeight < height) {
        const constants = network.constants[constantIndex];
        const nextConstants = network.constants[constantIndex + 1];

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

    return +new Bignum(config.genesisBlock.totalAmount).plus(rewards).toFixed();
}

export { calculate };
