"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const utils_1 = require("../utils");
const transaction_1 = require("./transaction");
class TransferTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.TransferTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [];
    }
    async bootstrap(connection, walletManager) {
        const transactions = await connection.transactionsRepository.getReceivedTransactions();
        for (const transaction of transactions) {
            const wallet = walletManager.findByAddress(transaction.recipientId);
            wallet.balance = wallet.balance.plus(transaction.amount);
        }
    }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, sender, walletManager) {
        return super.throwIfCannotBeApplied(transaction, sender, walletManager);
    }
    hasVendorField() {
        return true;
    }
    async canEnterTransactionPool(data, pool, processor) {
        if (!utils_1.isRecipientOnActiveNetwork(data)) {
            return {
                type: "ERR_INVALID_RECIPIENT",
                message: `Recipient ${data.recipientId} is not on the same network: ${crypto_1.Managers.configManager.get("network.pubKeyHash")}`,
            };
        }
        return null;
    }
    async applyToRecipient(transaction, walletManager) {
        const recipient = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }
    async revertForRecipient(transaction, walletManager) {
        const recipient = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
exports.TransferTransactionHandler = TransferTransactionHandler;
//# sourceMappingURL=transfer.js.map