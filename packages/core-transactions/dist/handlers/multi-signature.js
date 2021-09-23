"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const transaction_1 = require("./transaction");
class MultiSignatureTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.MultiSignatureRegistrationTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["multiSignature"];
    }
    async bootstrap(connection, walletManager) {
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                let wallet;
                let multiSignature;
                if (transaction.version === 1) {
                    multiSignature = transaction.asset.multisignature || transaction.asset.multiSignatureLegacy;
                    wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                    multiSignature.legacy = true;
                }
                else {
                    multiSignature = transaction.asset.multiSignature;
                    wallet = walletManager.findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(multiSignature));
                }
                if (wallet.hasMultiSignature()) {
                    throw new errors_1.MultiSignatureAlreadyRegisteredError();
                }
                wallet.setAttribute("multiSignature", multiSignature);
                walletManager.reindex(wallet);
            }
        }
    }
    // Technically, we only enable `MultiSignatureRegistration` when the `aip11` milestone is active,
    // but since there are no versioned transaction types yet we have to do it differently, to not break
    // existing legacy multi signatures. TODO: becomes obsolete with 3.0
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        const { data } = transaction;
        if (crypto_1.Utils.isException(data)) {
            return;
        }
        const { publicKeys, min } = data.asset.multiSignature;
        if (min < 1 || min > publicKeys.length || min > 16) {
            throw new errors_1.MultiSignatureMinimumKeysError();
        }
        if (publicKeys.length !== data.signatures.length) {
            throw new errors_1.MultiSignatureKeyCountMismatchError();
        }
        const multiSigPublicKey = crypto_1.Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature);
        const recipientWallet = walletManager.findByPublicKey(multiSigPublicKey);
        if (recipientWallet.hasMultiSignature()) {
            throw new errors_1.MultiSignatureAlreadyRegisteredError();
        }
        if (!wallet.verifySignatures(data, data.asset.multiSignature)) {
            throw new errors_1.InvalidMultiSignatureError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        // Create the multi sig wallet
        if (transaction.data.version >= 2) {
            walletManager
                .findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(transaction.data.asset.multiSignature))
                .setAttribute("multiSignature", transaction.data.asset.multiSignature);
        }
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }
    async applyToRecipient(transaction, walletManager) {
        const { data } = transaction;
        if (data.version >= 2) {
            const recipientWallet = walletManager.findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature));
            recipientWallet.setAttribute("multiSignature", transaction.data.asset.multiSignature);
        }
    }
    async revertForRecipient(transaction, walletManager) {
        const { data } = transaction;
        if (data.version >= 2) {
            const recipientWallet = walletManager.findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature));
            recipientWallet.forgetAttribute("multiSignature");
        }
    }
}
exports.MultiSignatureTransactionHandler = MultiSignatureTransactionHandler;
//# sourceMappingURL=multi-signature.js.map