"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
exports.isRecipientOnActiveNetwork = (transaction) => {
    return (crypto_1.Utils.Base58.decodeCheck(transaction.recipientId).readUInt8(0) ===
        crypto_1.Managers.configManager.get("network.pubKeyHash"));
};
//# sourceMappingURL=utils.js.map