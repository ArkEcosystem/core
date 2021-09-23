"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
exports.calculateLockExpirationStatus = (expiration) => {
    const lastBlock = core_container_1.app
        .resolvePlugin("state")
        .getStore()
        .getLastBlock();
    return ((expiration.type === crypto_1.Enums.HtlcLockExpirationType.EpochTimestamp &&
        expiration.value <= lastBlock.data.timestamp) ||
        (expiration.type === crypto_1.Enums.HtlcLockExpirationType.BlockHeight && expiration.value <= lastBlock.data.height));
};
//# sourceMappingURL=lock-expiration-calculator.js.map