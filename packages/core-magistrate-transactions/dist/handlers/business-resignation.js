"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const events_1 = require("../events");
const business_registration_1 = require("./business-registration");
const magistrate_handler_1 = require("./magistrate-handler");
class BusinessResignationTransactionHandler extends magistrate_handler_1.MagistrateTransactionHandler {
    getConstructor() {
        return core_magistrate_crypto_1.Transactions.BusinessResignationTransaction;
    }
    dependencies() {
        return [business_registration_1.BusinessRegistrationTransactionHandler];
    }
    walletAttributes() {
        return [];
    }
    async bootstrap(connection, walletManager) {
        const reader = await core_transactions_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                wallet.setAttribute("business.resigned", true);
                walletManager.reindex(wallet);
            }
        }
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (crypto_1.Utils.isException(transaction.data)) {
            return;
        }
        if (!wallet.hasAttribute("business")) {
            throw new errors_1.BusinessIsNotRegisteredError();
        }
        if (wallet.getAttribute("business").resigned) {
            throw new errors_1.BusinessIsResignedError();
        }
        const bridgechains = wallet.getAttribute("business.bridgechains");
        if (bridgechains && Object.values(bridgechains).some(bridgechain => !bridgechain.resigned)) {
            throw new errors_1.BridgechainsAreNotResignedError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(events_1.MagistrateApplicationEvents.BusinessResigned, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        if (await pool.senderHasTransactionsOfType(data.senderPublicKey, core_magistrate_crypto_1.Enums.MagistrateTransactionType.BusinessResignation, core_magistrate_crypto_1.Enums.MagistrateTransactionGroup)) {
            const wallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            return {
                type: "ERR_PENDING",
                message: `Business resignation for "${wallet.getAttribute("business")}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setAttribute("business.resigned", true);
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.forgetAttribute("business.resigned");
        walletManager.reindex(sender);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.BusinessResignationTransactionHandler = BusinessResignationTransactionHandler;
//# sourceMappingURL=business-resignation.js.map