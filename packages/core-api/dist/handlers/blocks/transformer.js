"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
exports.transformBlock = (model, transform) => {
    if (!transform) {
        model.reward = crypto_1.Utils.BigNumber.make(model.reward).toFixed();
        model.totalFee = crypto_1.Utils.BigNumber.make(model.totalFee).toFixed();
        model.totalAmount = crypto_1.Utils.BigNumber.make(model.totalAmount).toFixed();
        return model;
    }
    const databaseService = core_container_1.app.resolvePlugin("database");
    const generator = databaseService.walletManager.findByPublicKey(model.generatorPublicKey);
    const lastBlock = core_container_1.app.resolvePlugin("blockchain").getLastBlock();
    model.reward = crypto_1.Utils.BigNumber.make(model.reward);
    model.totalFee = crypto_1.Utils.BigNumber.make(model.totalFee);
    return {
        id: model.id,
        version: +model.version,
        height: +model.height,
        previous: model.previousBlock,
        forged: {
            reward: model.reward.toFixed(),
            fee: model.totalFee.toFixed(),
            total: model.reward.plus(model.totalFee).toFixed(),
            amount: crypto_1.Utils.BigNumber.make(model.totalAmount).toFixed(),
        },
        payload: {
            hash: model.payloadHash,
            length: model.payloadLength,
        },
        generator: {
            username: generator.getAttribute("delegate.username"),
            address: generator.address,
            publicKey: generator.publicKey,
        },
        signature: model.blockSignature,
        confirmations: lastBlock ? lastBlock.data.height - model.height : 0,
        transactions: model.numberOfTransactions,
        timestamp: core_utils_1.formatTimestamp(model.timestamp),
    };
};
//# sourceMappingURL=transformer.js.map