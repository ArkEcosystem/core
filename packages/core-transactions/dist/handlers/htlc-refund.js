"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const assert = require("assert");
const errors_1 = require("../errors");
const htlc_lock_1 = require("./htlc-lock");
const transaction_1 = require("./transaction");
class HtlcRefundTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.HtlcRefundTransaction;
    }
    dependencies() {
        return [htlc_lock_1.HtlcLockTransactionHandler];
    }
    walletAttributes() {
        return [];
    }
    async bootstrap(connection, walletManager) {
        const transactions = await connection.transactionsRepository.getRefundedHtlcLocks();
        for (const transaction of transactions) {
            const refundWallet = walletManager.findByPublicKey(transaction.senderPublicKey); // sender is from the original lock
            refundWallet.balance = refundWallet.balance.plus(transaction.amount);
        }
    }
    async isActivated() {
        const milestone = crypto_1.Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }
    dynamicFee(context) {
        // override dynamicFee calculation as this is a zero-fee transaction
        return crypto_1.Utils.BigNumber.ZERO;
    }
    async throwIfCannotBeApplied(transaction, sender, walletManager) {
        await this.performGenericWalletChecks(transaction, sender, walletManager);
        // Specific HTLC refund checks
        const refundAsset = transaction.data.asset.refund;
        const lockId = refundAsset.lockTransactionId;
        const dbWalletManager = core_container_1.app.resolvePlugin("database")
            .walletManager;
        const lockWallet = dbWalletManager.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new errors_1.HtlcLockTransactionNotFoundError();
        }
        const lock = lockWallet.getAttribute("htlc.locks")[lockId];
        if (!core_utils_1.expirationCalculator.calculateLockExpirationStatus(lock.expiration)) {
            throw new errors_1.HtlcLockNotExpiredError();
        }
    }
    async canEnterTransactionPool(data, pool, processor) {
        const lockId = data.asset.refund.lockTransactionId;
        const databaseService = core_container_1.app.resolvePlugin("database");
        const lockWallet = databaseService.walletManager.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            return {
                type: "ERR_HTLCLOCKNOTFOUND",
                message: `The associated lock transaction id "${lockId}" was not found.`,
            };
        }
        const htlcRefundsInpool = Array.from(await pool.getTransactionsByType(crypto_1.Enums.TransactionType.HtlcRefund)).map((memTx) => memTx.data);
        const alreadyHasPendingRefund = htlcRefundsInpool.some(transaction => transaction.asset.claim.lockTransactionId === lockId);
        if (alreadyHasPendingRefund) {
            return {
                type: "ERR_PENDING",
                message: `HtlcRefund for "${lockId}" already in the pool`,
            };
        }
        return null;
    }
    async applyToSender(transaction, walletManager) {
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        if (crypto_1.Utils.isException(data)) {
            walletManager.logger.warn(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }
        await this.throwIfCannotBeApplied(transaction, sender, walletManager);
        sender.verifyTransactionNonceApply(transaction);
        sender.nonce = data.nonce;
        const lockId = data.asset.refund.lockTransactionId;
        const lockWallet = walletManager.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
        assert(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);
        const locks = lockWallet.getAttribute("htlc.locks");
        const newBalance = lockWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());
        lockWallet.balance = newBalance;
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance");
        const newLockedBalance = lockedBalance.minus(locks[lockId].amount);
        assert(!newLockedBalance.isNegative());
        lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);
        delete locks[lockId];
        walletManager.reindex(lockWallet);
    }
    async revertForSender(transaction, walletManager) {
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.verifyTransactionNonceRevert(transaction);
        sender.nonce = sender.nonce.minus(1);
        // TODO: not so good to call database from here, would need a better way
        const databaseService = core_container_1.app.resolvePlugin("database");
        const lockId = transaction.data.asset.refund.lockTransactionId;
        const lockTransaction = await databaseService.transactionsBusinessRepository.findById(lockId);
        const lockWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);
        lockWallet.balance = lockWallet.balance.minus(lockTransaction.amount).plus(transaction.data.fee);
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance");
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));
        const locks = lockWallet.getAttribute("htlc.locks");
        locks[lockTransaction.id] = {
            amount: lockTransaction.amount,
            recipientId: lockTransaction.recipientId,
            timestamp: lockTransaction.timestamp,
            vendorField: lockTransaction.vendorField
                ? Buffer.from(lockTransaction.vendorField, "hex").toString("utf8")
                : undefined,
            ...lockTransaction.asset.lock,
        };
        walletManager.reindex(lockWallet);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.HtlcRefundTransactionHandler = HtlcRefundTransactionHandler;
//# sourceMappingURL=htlc-refund.js.map