"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const errors_1 = require("../errors");
const events_1 = require("../events");
const bridgechain_registration_1 = require("./bridgechain-registration");
const magistrate_handler_1 = require("./magistrate-handler");
class BridgechainResignationTransactionHandler extends magistrate_handler_1.MagistrateTransactionHandler {
    getConstructor() {
        return core_magistrate_crypto_1.Transactions.BridgechainResignationTransaction;
    }
    dependencies() {
        return [bridgechain_registration_1.BridgechainRegistrationTransactionHandler];
    }
    walletAttributes() {
        return ["business.bridgechains.bridgechain.resigned"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await core_transactions_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const businessAttributes = wallet.getAttribute("business");
                const bridgechainAsset = businessAttributes.bridgechains[transaction.asset.bridgechainResignation.bridgechainId];
                bridgechainAsset.resigned = true;
                wallet.setAttribute("business", businessAttributes);
                walletManager.reindex(wallet);
            }
        }
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (!wallet.hasAttribute("business")) {
            throw new errors_1.WalletIsNotBusinessError();
        }
        const businessAttributes = wallet.getAttribute("business");
        if (businessAttributes.resigned) {
            throw new errors_1.BusinessIsResignedError();
        }
        if (!businessAttributes.bridgechains) {
            throw new errors_1.BridgechainIsNotRegisteredByWalletError();
        }
        const bridgechainResignation = transaction.data.asset.bridgechainResignation;
        const bridgechainAttributes = businessAttributes.bridgechains[bridgechainResignation.bridgechainId];
        if (!bridgechainAttributes) {
            throw new errors_1.BridgechainIsNotRegisteredByWalletError();
        }
        if (bridgechainAttributes.resigned) {
            throw new errors_1.BridgechainIsResignedError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(events_1.MagistrateApplicationEvents.BridgechainResigned, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        const { bridgechainId } = data.asset.bridgechainResignation;
        const bridgechainResignationsInPool = Array.from(await pool.getTransactionsByType(core_magistrate_crypto_1.Enums.MagistrateTransactionType.BridgechainResignation, core_magistrate_crypto_1.Enums.MagistrateTransactionGroup)).map((memTx) => memTx.data);
        if (bridgechainResignationsInPool.some(resignation => resignation.senderPublicKey === data.senderPublicKey &&
            resignation.asset.bridgechainResignation.bridgechainId === bridgechainId)) {
            return {
                type: "ERR_PENDING",
                message: `Bridgechain resignation for bridgechainId "${bridgechainId}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes = sender.getAttribute("business");
        const bridgechainResignation = transaction.data.asset.bridgechainResignation;
        businessAttributes.bridgechains[bridgechainResignation.bridgechainId].resigned = true;
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes = sender.getAttribute("business");
        const bridgechainResignation = transaction.data.asset.bridgechainResignation;
        businessAttributes.bridgechains[bridgechainResignation.bridgechainId].resigned = false;
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.BridgechainResignationTransactionHandler = BridgechainResignationTransactionHandler;
//# sourceMappingURL=bridgechain-resignation.js.map