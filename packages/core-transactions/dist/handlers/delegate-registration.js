"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_reader_1 = require("../transaction-reader");
const transaction_1 = require("./transaction");
const { TransactionType, TransactionTypeGroup } = crypto_1.Enums;
class DelegateRegistrationTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.DelegateRegistrationTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [
            "delegate",
            "delegate.lastBlock",
            "delegate.producedBlocks",
            "delegate.rank",
            "delegate.round",
            "delegate.username",
            "delegate.voteBalance",
            "delegate.forgedFees",
            "delegate.forgedRewards",
            "delegate.forgedTotal",
            "delegate.approval",
        ];
    }
    async bootstrap(connection, walletManager) {
        const forgedBlocks = await connection.blocksRepository.getDelegatesForgedBlocks();
        const lastForgedBlocks = await connection.blocksRepository.getLastForgedBlocks();
        const reader = await transaction_reader_1.TransactionReader.create(connection, this.getConstructor());
        while (reader.hasNext()) {
            const transactions = await reader.read();
            for (const transaction of transactions) {
                const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                wallet.setAttribute("delegate", {
                    username: transaction.asset.delegate.username,
                    voteBalance: crypto_1.Utils.BigNumber.ZERO,
                    forgedFees: crypto_1.Utils.BigNumber.ZERO,
                    forgedRewards: crypto_1.Utils.BigNumber.ZERO,
                    producedBlocks: 0,
                    rank: undefined,
                });
                walletManager.reindex(wallet);
            }
        }
        for (const block of forgedBlocks) {
            const wallet = walletManager.findByPublicKey(block.generatorPublicKey);
            const delegate = wallet.getAttribute("delegate");
            // Genesis wallet is empty
            if (!delegate) {
                continue;
            }
            delegate.forgedFees = delegate.forgedFees.plus(block.totalFees);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.totalRewards);
            delegate.producedBlocks += +block.totalProduced;
        }
        for (const block of lastForgedBlocks) {
            const wallet = walletManager.findByPublicKey(block.generatorPublicKey);
            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }
            wallet.setAttribute("delegate.lastBlock", block);
        }
    }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        const { data } = transaction;
        const sender = walletManager.findByPublicKey(data.senderPublicKey);
        if (sender.hasMultiSignature()) {
            throw new errors_1.NotSupportedForMultiSignatureWalletError();
        }
        const { username } = data.asset.delegate;
        if (!username) {
            throw new errors_1.WalletNotADelegateError();
        }
        if (wallet.isDelegate()) {
            throw new errors_1.WalletIsAlreadyDelegateError();
        }
        if (walletManager.findByUsername(username)) {
            throw new errors_1.WalletUsernameAlreadyRegisteredError(username);
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    emitEvents(transaction, emitter) {
        emitter.emit(core_event_emitter_1.ApplicationEvents.DelegateRegistered, transaction.data);
    }
    async canEnterTransactionPool(data, pool, processor) {
        const err = await this.typeFromSenderAlreadyInPool(data, pool);
        if (err !== null) {
            return err;
        }
        const { username } = data.asset.delegate;
        const delegateRegistrationsSameNameInPayload = processor
            .getTransactions()
            .filter(transaction => transaction.type === TransactionType.DelegateRegistration &&
            (transaction.typeGroup === undefined || transaction.typeGroup === TransactionTypeGroup.Core) &&
            transaction.asset.delegate.username === username);
        if (delegateRegistrationsSameNameInPayload.length > 1) {
            return {
                type: "ERR_CONFLICT",
                message: `Multiple delegate registrations for "${username}" in transaction payload`,
            };
        }
        const delegateRegistrationsInPool = Array.from(await pool.getTransactionsByType(TransactionType.DelegateRegistration)).map((memTx) => memTx.data);
        const containsDelegateRegistrationForSameNameInPool = delegateRegistrationsInPool.some(transaction => transaction.asset.delegate.username === username);
        if (containsDelegateRegistrationForSameNameInPool) {
            return {
                type: "ERR_PENDING",
                message: `Delegate registration for "${username}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setAttribute("delegate", {
            username: transaction.data.asset.delegate.username,
            voteBalance: crypto_1.Utils.BigNumber.ZERO,
            forgedFees: crypto_1.Utils.BigNumber.ZERO,
            forgedRewards: crypto_1.Utils.BigNumber.ZERO,
            producedBlocks: 0,
            round: 0,
        });
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const username = sender.getAttribute("delegate.username");
        walletManager.forgetByUsername(username);
        sender.forgetAttribute("delegate");
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.DelegateRegistrationTransactionHandler = DelegateRegistrationTransactionHandler;
//# sourceMappingURL=delegate-registration.js.map