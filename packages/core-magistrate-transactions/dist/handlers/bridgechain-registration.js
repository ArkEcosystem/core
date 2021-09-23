"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_magistrate_crypto_1 = require("@arkecosystem/core-magistrate-crypto");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const events_1 = require("../events");
const business_registration_1 = require("./business-registration");
const magistrate_handler_1 = require("./magistrate-handler");
const utils_1 = require("./utils");
class BridgechainRegistrationTransactionHandler extends magistrate_handler_1.MagistrateTransactionHandler {
    getConstructor() {
        return core_magistrate_crypto_1.Transactions.BridgechainRegistrationTransaction;
    }
    dependencies() {
        return [business_registration_1.BusinessRegistrationTransactionHandler];
    }
    walletAttributes() {
        return ["business.bridgechains.bridgechain"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await core_transactions_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const businessAttributes = wallet.getAttribute("business");
                if (!businessAttributes.bridgechains) {
                    businessAttributes.bridgechains = {};
                }
                const bridgechainId = transaction.asset.bridgechainRegistration.genesisHash;
                businessAttributes.bridgechains[bridgechainId] = {
                    bridgechainAsset: transaction.asset.bridgechainRegistration,
                };
                wallet.setAttribute("business", businessAttributes);
                walletManager.reindex(wallet);
            }
        }
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        if (crypto_1.Utils.isException(transaction.data)) {
            return;
        }
        if (!wallet.hasAttribute("business")) {
            throw new errors_1.WalletIsNotBusinessError();
        }
        if (wallet.getAttribute("business.resigned") === true) {
            throw new errors_1.BusinessIsResignedError();
        }
        const { data } = transaction;
        const bridgechains = wallet.getAttribute("business.bridgechains");
        if (bridgechains &&
            Object.values(bridgechains).some(bridgechain => bridgechain.bridgechainAsset.name.toLowerCase() ===
                data.asset.bridgechainRegistration.name.toLowerCase())) {
            throw new errors_1.BridgechainAlreadyRegisteredError();
        }
        if (bridgechains && bridgechains[data.asset.bridgechainRegistration.genesisHash]) {
            throw new errors_1.GenesisHashAlreadyRegisteredError();
        }
        for (const portKey of Object.keys(data.asset.bridgechainRegistration.ports)) {
            if (!utils_1.packageNameRegex.test(portKey)) {
                throw new errors_1.PortKeyMustBeValidPackageNameError();
            }
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(events_1.MagistrateApplicationEvents.BridgechainRegistered, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes = sender.getAttribute("business");
        if (!businessAttributes.bridgechains) {
            businessAttributes.bridgechains = {};
        }
        const bridgechainId = transaction.data.asset.bridgechainRegistration.genesisHash;
        businessAttributes.bridgechains[bridgechainId] = {
            bridgechainAsset: transaction.data.asset.bridgechainRegistration,
        };
        sender.setAttribute("business", businessAttributes);
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes = sender.getAttribute("business");
        const bridgechainId = Object.keys(businessAttributes.bridgechains).pop();
        delete businessAttributes.bridgechains[bridgechainId];
        walletManager.reindex(sender);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.BridgechainRegistrationTransactionHandler = BridgechainRegistrationTransactionHandler;
//# sourceMappingURL=bridgechain-registration.js.map