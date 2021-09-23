"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const errors_1 = require("../errors");
const events_1 = require("../events");
const wallet_manager_1 = require("../wallet-manager");
const magistrate_handler_1 = require("./magistrate-handler");
class BusinessRegistrationTransactionHandler extends magistrate_handler_1.MagistrateTransactionHandler {
    getConstructor() {
        return core_magistrate_crypto_1.Transactions.BusinessRegistrationTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [
            "business",
            "business.businessAsset",
            "business.transactionId",
            "business.bridgechains",
            "business.resigned",
        ];
    }
    async bootstrap(connection, walletManager) {
        const reader = await core_transactions_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const asset = {
                    businessAsset: transaction.asset.businessRegistration,
                };
                wallet.setAttribute("business", asset);
                walletManager.reindex(wallet);
            }
        }
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (wallet.hasAttribute("business")) {
            throw new errors_1.BusinessAlreadyRegisteredError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(events_1.MagistrateApplicationEvents.BusinessRegistered, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        if (await pool.senderHasTransactionsOfType(data.senderPublicKey, core_magistrate_crypto_1.Enums.MagistrateTransactionType.BusinessRegistration, core_magistrate_crypto_1.Enums.MagistrateTransactionGroup)) {
            const wallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            return {
                type: "ERR_PENDING",
                message: `Business registration for "${wallet.getAttribute("business")}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAsset = {
            businessAsset: transaction.data.asset.businessRegistration,
        };
        sender.setAttribute("business", businessAsset);
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.forgetAttribute("business");
        walletManager.forgetByIndex(wallet_manager_1.MagistrateIndex.Businesses, sender.publicKey);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.BusinessRegistrationTransactionHandler = BusinessRegistrationTransactionHandler;
//# sourceMappingURL=business-registration.js.map