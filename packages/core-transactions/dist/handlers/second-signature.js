"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const transaction_1 = require("./transaction");
class SecondSignatureTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.SecondSignatureRegistrationTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["secondPublicKey"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                wallet.setAttribute("secondPublicKey", transaction.asset.signature.publicKey);
            }
        }
    }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (wallet.hasSecondSignature()) {
            throw new errors_1.SecondSignatureAlreadyRegisteredError();
        }
        if (walletManager.findByPublicKey(transaction.data.senderPublicKey).hasMultiSignature()) {
            throw new errors_1.NotSupportedForMultiSignatureWalletError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        walletManager
            .findByPublicKey(transaction.data.senderPublicKey)
            .setAttribute("secondPublicKey", transaction.data.asset.signature.publicKey);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        walletManager.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("secondPublicKey");
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.SecondSignatureTransactionHandler = SecondSignatureTransactionHandler;
//# sourceMappingURL=second-signature.js.map