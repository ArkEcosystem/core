"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
class MagistrateTransactionHandler extends core_transactions_1.Handlers.TransactionHandler {
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
}
exports.MagistrateTransactionHandler = MagistrateTransactionHandler;
//# sourceMappingURL=magistrate-handler.js.map