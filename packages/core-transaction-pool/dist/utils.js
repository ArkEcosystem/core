"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
exports.getMaxTransactionBytes = () => {
    const height = core_container_1.app
        .resolvePlugin("state")
        .getStore()
        .getLastHeight();
    const maxPayload = crypto_1.Managers.configManager.getMilestone(height).block.maxPayload;
    return maxPayload - 10 * 1024; // max block payload minus 10KB to have some margin for block header size
};
//# sourceMappingURL=utils.js.map