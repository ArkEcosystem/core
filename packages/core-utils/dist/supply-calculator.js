"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
exports.calculate = (height) => {
    const { genesisBlock, milestones } = core_container_1.app.getConfig().all();
    if (!height) {
        const blockchain = core_container_1.app.resolvePlugin("blockchain");
        height = blockchain ? blockchain.getLastBlock().data.height : 0;
    }
    const totalAmount = crypto_1.Utils.BigNumber.make(genesisBlock.totalAmount);
    if (height === 0 || milestones.length === 0) {
        return totalAmount.toFixed();
    }
    let rewards = crypto_1.Utils.BigNumber.ZERO;
    let currentHeight = 0;
    let constantIndex = 0;
    while (currentHeight < height) {
        const constants = milestones[constantIndex];
        const nextConstants = milestones[constantIndex + 1];
        let heightJump = height - currentHeight;
        if (nextConstants && height >= nextConstants.height && currentHeight < nextConstants.height - 1) {
            heightJump = nextConstants.height - 1 - currentHeight;
            constantIndex += 1;
        }
        currentHeight += heightJump;
        if (currentHeight >= constants.height) {
            rewards = rewards.plus(crypto_1.Utils.BigNumber.make(constants.reward).times(heightJump));
        }
    }
    return totalAmount.plus(rewards).toFixed();
};
//# sourceMappingURL=supply-calculator.js.map