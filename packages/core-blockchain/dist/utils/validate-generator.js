"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
exports.validateGenerator = async (block) => {
    const database = core_container_1.app.resolvePlugin("database");
    const logger = core_container_1.app.resolvePlugin("logger");
    const roundInfo = core_utils_1.roundCalculator.calculateRound(block.data.height);
    const delegates = await database.getActiveDelegates(roundInfo);
    const slot = crypto_1.Crypto.Slots.getSlotNumber(block.data.timestamp);
    const forgingDelegate = delegates[slot % delegates.length];
    const generatorUsername = database.walletManager
        .findByPublicKey(block.data.generatorPublicKey)
        .getAttribute("delegate.username");
    if (!forgingDelegate) {
        logger.debug(`Could not decide if delegate ${generatorUsername} (${block.data.generatorPublicKey}) is allowed to forge block ${block.data.height.toLocaleString()}`);
    }
    else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
        const forgingUsername = database.walletManager
            .findByPublicKey(forgingDelegate.publicKey)
            .getAttribute("delegate.username");
        logger.warn(`Delegate ${generatorUsername} (${block.data.generatorPublicKey}) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.publicKey})`);
        return false;
    }
    logger.debug(`Delegate ${generatorUsername} (${block.data.generatorPublicKey}) allowed to forge block ${block.data.height.toLocaleString()}`);
    return true;
};
//# sourceMappingURL=validate-generator.js.map