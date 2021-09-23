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
class HtlcClaimTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.HtlcClaimTransaction;
    }
    dependencies() {
        return [htlc_lock_1.HtlcLockTransactionHandler];
    }
    walletAttributes() {
        return [];
    }
    async bootstrap(connection, walletManager) {
        const transactions = await connection.transactionsRepository.getClaimedHtlcLocks();
        for (const transaction of transactions) {
            const claimWallet = walletManager.findByAddress(transaction.recipientId);
            claimWallet.balance = claimWallet.balance.plus(transaction.amount);
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
        // Specific HTLC claim checks
        const claimAsset = transaction.data.asset.claim;
        const lockId = claimAsset.lockTransactionId;
        const dbWalletManager = core_container_1.app.resolvePlugin("database")
            .walletManager;
        const lockWallet = dbWalletManager.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new errors_1.HtlcLockTransactionNotFoundError();
        }
        const lock = lockWallet.getAttribute("htlc.locks")[lockId];
        if (core_utils_1.expirationCalculator.calculateLockExpirationStatus(lock.expiration)) {
            throw new errors_1.HtlcLockExpiredError();
        }
        const unlockSecretBytes = Buffer.from(claimAsset.unlockSecret, "hex");
        const unlockSecretHash = crypto_1.Crypto.HashAlgorithms.sha256(unlockSecretBytes).toString("hex");
        if (lock.secretHash !== unlockSecretHash) {
            throw new errors_1.HtlcSecretHashMismatchError();
        }
    }
    async canEnterTransactionPool(data, pool, processor) {
        const lockId = data.asset.claim.lockTransactionId;
        const databaseService = core_container_1.app.resolvePlugin("database");
        const lockWallet = databaseService.walletManager.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            return {
                type: "ERR_HTLCLOCKNOTFOUND",
                message: `The associated lock transaction id "${lockId}" was not found.`,
            };
        }
        const htlcClaimsInPool = Array.from(await pool.getTransactionsByType(crypto_1.Enums.TransactionType.HtlcClaim)).map((memTx) => memTx.data);
        const alreadyHasPendingClaim = htlcClaimsInPool.some(transaction => transaction.asset.claim.lockTransactionId === lockId);
        if (alreadyHasPendingClaim) {
            return {
                type: "ERR_PENDING",
                message: `HtlcClaim for "${lockId}" already in the pool`,
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
        const lockId = data.asset.claim.lockTransactionId;
        const lockWallet = walletManager.findByIndex(core_interfaces_1.State.WalletIndexes.Locks, lockId);
        assert(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);
        const locks = lockWallet.getAttribute("htlc.locks");
        const recipientWallet = walletManager.findByAddress(locks[lockId].recipientId);
        const newBalance = recipientWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());
        recipientWallet.balance = newBalance;
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance");
        const newLockedBalance = lockedBalance.minus(locks[lockId].amount);
        assert(!newLockedBalance.isNegative());
        lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);
        delete locks[lockId];
        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }
    async revertForSender(transaction, walletManager) {
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        sender.verifyTransactionNonceRevert(transaction);
        sender.nonce = sender.nonce.minus(1);
        // TODO: not so good to call database from here, would need a better way
        const databaseService = core_container_1.app.resolvePlugin("database");
        const lockId = data.asset.claim.lockTransactionId;
        const lockTransaction = await databaseService.transactionsBusinessRepository.findById(lockId);
        const lockWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);
        const recipientWallet = walletManager.findByAddress(lockTransaction.recipientId);
        recipientWallet.balance = recipientWallet.balance.minus(lockTransaction.amount).plus(data.fee);
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
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
        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.HtlcClaimTransactionHandler = HtlcClaimTransactionHandler;
//# sourceMappingURL=htlc-claim.js.map