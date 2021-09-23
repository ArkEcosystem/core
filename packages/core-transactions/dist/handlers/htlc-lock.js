"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const transaction_1 = require("./transaction");
class HtlcLockTransactionHandler extends transaction_1.TransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.HtlcLockTransaction;
    }
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["htlc.locks", "htlc.lockedBalance"];
    }
    async bootstrap(connection, walletManager) {
        const transactions = await connection.transactionsRepository.getOpenHtlcLocks();
        const walletsToIndex = {};
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const locks = wallet.getAttribute("htlc.locks", {});
            let lockedBalance = wallet.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
            if (transaction.open) {
                locks[transaction.id] = {
                    amount: crypto_1.Utils.BigNumber.make(transaction.amount),
                    recipientId: transaction.recipientId,
                    timestamp: transaction.timestamp,
                    vendorField: transaction.vendorField
                        ? Buffer.from(transaction.vendorField, "hex").toString("utf8")
                        : undefined,
                    ...transaction.asset.lock,
                };
                lockedBalance = lockedBalance.plus(transaction.amount);
                const recipientWallet = walletManager.findByAddress(transaction.recipientId);
                walletsToIndex[wallet.address] = wallet;
                walletsToIndex[recipientWallet.address] = recipientWallet;
            }
            wallet.setAttribute("htlc.locks", locks);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance);
        }
        walletManager.index(Object.values(walletsToIndex));
    }
    async isActivated() {
        const milestone = crypto_1.Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }
    async throwIfCannotBeApplied(transaction, wallet, walletManager) {
        const lock = transaction.data.asset.lock;
        const lastBlock = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastBlock();
        let { blocktime, activeDelegates } = crypto_1.Managers.configManager.getMilestone();
        const expiration = lock.expiration;
        // TODO: find a better way to alter minimum lock expiration
        if (process.env.CORE_ENV === "test") {
            blocktime = 0;
            activeDelegates = 0;
        }
        if ((expiration.type === crypto_1.Enums.HtlcLockExpirationType.EpochTimestamp &&
            expiration.value <= lastBlock.data.timestamp + blocktime * activeDelegates) ||
            (expiration.type === crypto_1.Enums.HtlcLockExpirationType.BlockHeight &&
                expiration.value <= lastBlock.data.height + activeDelegates)) {
            throw new errors_1.HtlcLockExpiredError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
    async canEnterTransactionPool(data, pool, processor) {
        return null;
    }
    async applyToSender(transaction, walletManager) {
        await super.applyToSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const locks = sender.getAttribute("htlc.locks", {});
        locks[transaction.id] = {
            amount: transaction.data.amount,
            recipientId: transaction.data.recipientId,
            timestamp: transaction.timestamp,
            vendorField: transaction.data.vendorField,
            ...transaction.data.asset.lock,
        };
        sender.setAttribute("htlc.locks", locks);
        const lockedBalance = sender.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.data.amount));
        walletManager.reindex(sender);
    }
    async revertForSender(transaction, walletManager) {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance = sender.getAttribute("htlc.lockedBalance");
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));
        const locks = sender.getAttribute("htlc.locks");
        delete locks[transaction.id];
        walletManager.reindex(sender);
    }
    async applyToRecipient(transaction, walletManager) { }
    async revertForRecipient(transaction, walletManager) { }
}
exports.HtlcLockTransactionHandler = HtlcLockTransactionHandler;
//# sourceMappingURL=htlc-lock.js.map