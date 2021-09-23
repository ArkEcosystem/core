"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const delegate_registration_1 = require("./delegate-registration");
const transaction_1 = require("./transaction");
class DelegateResignationTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.DelegateResignationTransaction;
    }
    dependencies() {
        return [delegate_registration_1.DelegateRegistrationTransactionHandler];
    }
    walletAttributes() {
        return ["delegate.resigned"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                wallet.setAttribute("delegate.resigned", true);
                walletManager.reindex(wallet);
            }
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (!wallet.isDelegate()) {
            throw new errors_1.WalletNotADelegateError();
        }
        if (wallet.hasAttribute("delegate.resigned")) {
            throw new errors_1.WalletAlreadyResignedError();
        }
        const delegates = core_container_1.app
            .resolvePlugin("database")
            .walletManager.allByUsername();
        let requiredDelegates = crypto_1.Managers.configManager.getMilestone().activeDelegates + 1;
        for (const delegate of delegates) {
            if (requiredDelegates === 0) {
                break;
            }
            if (delegate.getAttribute("delegate.resigned")) {
                continue;
            }
            requiredDelegates--;
        }
        if (requiredDelegates > 0) {
            throw new errors_1.NotEnoughDelegatesError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(core_event_emitter_1.ApplicationEvents.DelegateResigned, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setAttribute("delegate.resigned", true);
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        walletManager.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("delegate.resigned");
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.DelegateResignationTransactionHandler = DelegateResignationTransactionHandler;
//# sourceMappingURL=delegate-resignation.js.map