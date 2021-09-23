"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const transaction_1 = require("./transaction");
// tslint:disable-next-line: max-classes-per-file
class MultiPaymentTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.MultiPaymentTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [];
    }
    async bootstrap(connection, walletManager) {
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const sender = walletManager.findByPublicKey(transaction.senderPublicKey);
                for (const payment of transaction.asset.payments) {
                    const recipient = walletManager.findByAddress(payment.recipientId);
                    recipient.balance = recipient.balance.plus(payment.amount);
                    sender.balance = sender.balance.minus(payment.amount);
                }
            }
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
        if (wallet.balance
            .minus(totalPaymentsAmount)
            .minus(transaction.data.fee)
            .isNegative()) {
            throw new errors_1.InsufficientBalanceError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }
    // tslint:disable-next-line:no-empty
    async applyToRecipient(transaction, walletManager) {
        for (const payment of transaction.data.asset.payments) {
            const recipient = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }
    // tslint:disable-next-line:no-empty
    async revertForRecipient(transaction, walletManager) {
        for (const payment of transaction.data.asset.payments) {
            const recipient = walletManager.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
}
exports.MultiPaymentTransactionHandler = MultiPaymentTransactionHandler;
//# sourceMappingURL=multi-payment.js.map