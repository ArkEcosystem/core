"use strict";
// tslint:disable:max-classes-per-file
// tslint:disable:member-ordering
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const errors_1 = require("../errors");
class TransactionHandler {
    async verify(transaction, walletManager) {
        const senderWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        if (senderWallet.hasMultiSignature()) {
            transaction.isVerified = senderWallet.verifySignatures(transaction.data);
        }
        return transaction.isVerified;
    }
    dynamicFee({ addonBytes, satoshiPerByte, transaction }) {
        addonBytes = addonBytes || 0;
        if (satoshiPerByte <= 0) {
            satoshiPerByte = 1;
        }
        const transactionSizeInBytes = Math.round(transaction.serialized.length / 2);
        return crypto_1.Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
    }
    async performGenericWalletChecks(transaction, sender, walletManager) {
        const data = transaction.data;
        if (crypto_1.Utils.isException(data)) {
            return;
        }
        sender.verifyTransactionNonceApply(transaction);
        if (sender.balance
            .minus(data.amount)
            .minus(data.fee)
            .isNegative()) {
            throw new errors_1.InsufficientBalanceError();
        }
        if (data.senderPublicKey !== sender.publicKey) {
            throw new errors_1.SenderWalletMismatchError();
        }
        const dbWalletManager = core_container_1.app.resolvePlugin("database")
            .walletManager;
        if (sender.hasSecondSignature()) {
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender = dbWalletManager.findByPublicKey(data.senderPublicKey);
            if (!dbSender.hasSecondSignature()) {
                throw new errors_1.UnexpectedSecondSignatureError();
            }
            const secondPublicKey = dbSender.getAttribute("secondPublicKey");
            if (!crypto_1.Transactions.Verifier.verifySecondSignature(data, secondPublicKey)) {
                throw new errors_1.InvalidSecondSignatureError();
            }
        }
        else if (data.secondSignature || data.signSignature) {
            const isException = crypto_1.Managers.configManager.get("network.name") === "devnet" &&
                crypto_1.Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            if (!isException) {
                throw new errors_1.UnexpectedSecondSignatureError();
            }
        }
        // Prevent legacy multi signatures from being used
        const isMultiSignatureRegistration = transaction.type === crypto_1.Enums.TransactionType.MultiSignature &&
            transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core;
        if (isMultiSignatureRegistration && !crypto_1.Managers.configManager.getMilestone().aip11) {
            throw new errors_1.UnexpectedMultiSignatureError();
        }
        if (sender.hasMultiSignature()) {
            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const dbSender = dbWalletManager.findByPublicKey(transaction.data.senderPublicKey);
            if (dbSender.getAttribute("multiSignature").legacy) {
                throw new errors_1.LegacyMultiSignatureError();
            }
            if (!dbSender.hasMultiSignature()) {
                throw new errors_1.UnexpectedMultiSignatureError();
            }
            if (!dbSender.verifySignatures(data, dbSender.getAttribute("multiSignature"))) {
                throw new errors_1.InvalidMultiSignatureError();
            }
        }
        else if (transaction.data.signatures && !isMultiSignatureRegistration) {
            throw new errors_1.UnexpectedMultiSignatureError();
        }
    }
    async throwIfCannotBeApplied(transaction, sender, walletManager) {
        if (!walletManager.hasByPublicKey(sender.publicKey) &&
            walletManager.findByAddress(sender.address).balance.isZero()) {
            throw new errors_1.ColdWalletError();
        }
        return this.performGenericWalletChecks(transaction, sender, walletManager);
    }
    async apply(transaction, walletManager) {
        await this.applyToSender(transaction, walletManager);
        await this.applyToRecipient(transaction, walletManager);
    }
    async revert(transaction, walletManager) {
        await this.revertForSender(transaction, walletManager);
        await this.revertForRecipient(transaction, walletManager);
    }
    async applyToSender(transaction, walletManager) {
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        if (crypto_1.Utils.isException(data)) {
            walletManager.logger.warn(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }
        await this.throwIfCannotBeApplied(transaction, sender, walletManager);
        let nonce;
        if (data.version > 1) {
            sender.verifyTransactionNonceApply(transaction);
            nonce = data.nonce;
        }
        else {
            nonce = sender.nonce.plus(1);
        }
        const newBalance = sender.balance.minus(data.amount).minus(data.fee);
        if (process.env.CORE_ENV === "test") {
            assert_1.default(crypto_1.Utils.isException(transaction.data) || !newBalance.isNegative());
        }
        else {
            if (newBalance.isNegative()) {
                const negativeBalanceExceptions = crypto_1.Managers.configManager.get("exceptions.negativeBalances") || {};
                const negativeBalances = negativeBalanceExceptions[sender.publicKey] || {};
                if (!newBalance.isEqualTo(negativeBalances[nonce.toString()] || 0)) {
                    throw new errors_1.InsufficientBalanceError();
                }
            }
        }
        sender.balance = newBalance;
        sender.nonce = nonce;
    }
    async revertForSender(transaction, walletManager) {
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        if (data.version > 1) {
            sender.verifyTransactionNonceRevert(transaction);
        }
        sender.balance = sender.balance.plus(data.amount).plus(data.fee);
        sender.nonce = sender.nonce.minus(1);
    }
    /**
     * Database Service
     */
    // tslint:disable-next-line:no-empty
    emitEvents(transaction, emitter) { }
    /**
     * Transaction Pool logic
     */
    async canEnterTransactionPool(data, pool, processor) {
        return {
            type: "ERR_UNSUPPORTED",
            message: `Invalidating transaction of unsupported type '${crypto_1.Enums.TransactionType[data.type]}'`,
        };
    }
    async typeFromSenderAlreadyInPool(data, pool) {
        const { senderPublicKey, type } = data;
        if (await pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            return {
                type: "ERR_PENDING",
                message: `Sender ${senderPublicKey} already has a transaction of type '${crypto_1.Enums.TransactionType[type]}' in the pool`,
            };
        }
        return null;
    }
}
exports.TransactionHandler = TransactionHandler;
//# sourceMappingURL=transaction.js.map