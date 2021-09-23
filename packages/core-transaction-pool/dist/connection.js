"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const core_state_1 = require("@arkecosystem/core-state");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const crypto_1 = require("@arkecosystem/crypto");
const lodash_differencewith_1 = __importDefault(require("lodash.differencewith"));
const processor_1 = require("./processor");
const utils_1 = require("./utils");
class Connection {
    constructor({ options, walletManager, memory, storage, }) {
        this.loggedAllowedSenders = [];
        this.databaseService = core_container_1.app.resolvePlugin("database");
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.options = options;
        this.walletManager = walletManager;
        this.memory = memory;
        this.storage = storage;
    }
    async make() {
        this.memory.flush();
        this.storage.connect(this.options.storage);
        const transactionsFromDisk = this.storage.loadAll();
        for (const transaction of transactionsFromDisk) {
            this.memory.remember(transaction, true);
        }
        this.emitter.once(core_event_emitter_1.ApplicationEvents.StateBuilderFinished, async () => {
            // Remove from the pool invalid entries found in `transactionsFromDisk`.
            await this.validateTransactions(transactionsFromDisk);
            await this.purgeExpired();
            this.syncToPersistentStorage();
        });
        this.emitter.on(core_event_emitter_1.ApplicationEvents.InternalMilestoneChanged, () => this.purgeInvalidTransactions());
        return this;
    }
    disconnect() {
        this.syncToPersistentStorage();
        this.storage.disconnect();
    }
    makeProcessor() {
        return new processor_1.Processor(this);
    }
    getAllTransactions() {
        return this.memory.sortedByFee();
    }
    async getTransactionsByType(type, typeGroup) {
        if (typeGroup === undefined) {
            typeGroup = crypto_1.Enums.TransactionTypeGroup.Core;
        }
        await this.purgeExpired();
        return this.memory.getByType(type, typeGroup);
    }
    async getPoolSize() {
        await this.purgeExpired();
        return this.memory.count();
    }
    async getSenderSize(senderPublicKey) {
        await this.purgeExpired();
        return this.memory.getBySender(senderPublicKey).length;
    }
    async addTransactions(transactions) {
        const added = [];
        const notAdded = [];
        for (const transaction of transactions) {
            const result = await this.addTransaction(transaction);
            result.message ? notAdded.push(result) : added.push(transaction);
        }
        if (added.length > 0) {
            this.emitter.emit(core_event_emitter_1.ApplicationEvents.TransactionPoolAdded, added);
        }
        if (notAdded.length > 0) {
            this.emitter.emit(core_event_emitter_1.ApplicationEvents.TransactionPoolRejected, notAdded);
        }
        return { added, notAdded };
    }
    removeTransaction(transaction) {
        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }
    removeTransactionById(id, senderPublicKey) {
        this.memory.forget(id, senderPublicKey);
        this.syncToPersistentStorageIfNecessary();
        this.emitter.emit(core_event_emitter_1.ApplicationEvents.TransactionPoolRemoved, id);
    }
    removeTransactionsById(ids) {
        for (const id of ids) {
            this.removeTransactionById(id);
        }
    }
    async getTransaction(id) {
        await this.purgeExpired();
        return this.memory.getById(id);
    }
    async getTransactions(start, size, maxBytes) {
        return (await this.getValidatedTransactions(start, size, maxBytes)).map((transaction) => transaction.serialized);
    }
    async getTransactionsForForging(blockSize) {
        return (await this.getValidatedTransactions(0, blockSize, utils_1.getMaxTransactionBytes())).map(transaction => transaction.serialized.toString("hex"));
    }
    async getTransactionIdsForForging(start, size) {
        return (await this.getValidatedTransactions(start, size, utils_1.getMaxTransactionBytes())).map((transaction) => transaction.id);
    }
    removeTransactionsForSender(senderPublicKey) {
        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            this.removeTransactionById(transaction.id);
        }
    }
    // @TODO: move this to a more appropriate place
    async hasExceededMaxTransactions(senderPublicKey) {
        await this.purgeExpired();
        if (this.options.allowedSenders.includes(senderPublicKey)) {
            if (!this.loggedAllowedSenders.includes(senderPublicKey)) {
                this.logger.debug(`Transaction pool: allowing sender public key ${senderPublicKey} ` +
                    `(listed in options.allowedSenders), thus skipping throttling.`);
                this.loggedAllowedSenders.push(senderPublicKey);
            }
            return false;
        }
        return this.memory.getBySender(senderPublicKey).length >= this.options.maxTransactionsPerSender;
    }
    flush() {
        this.memory.flush();
        this.storage.deleteAll();
    }
    async has(transactionId) {
        if (!this.memory.has(transactionId)) {
            return false;
        }
        await this.purgeExpired();
        return this.memory.has(transactionId);
    }
    async acceptChainedBlock(block) {
        for (const transaction of block.transactions) {
            const { data } = transaction;
            const exists = await this.has(data.id);
            const senderPublicKey = data.senderPublicKey;
            const transactionHandler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
            await transactionHandler.applyToRecipient(transaction, this.walletManager);
            const senderWallet = this.walletManager.findByPublicKey(senderPublicKey);
            const recipientWallet = this.walletManager.hasByAddress(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : undefined;
            if (exists) {
                this.removeTransaction(transaction);
            }
            else if (senderWallet) {
                try {
                    await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet, this.databaseService.walletManager);
                    await transactionHandler.applyToSender(transaction, this.walletManager);
                }
                catch (error) {
                    this.purgeByPublicKey(data.senderPublicKey); // reset sender tx pool and wallet as it can be outdated
                    if (recipientWallet) {
                        recipientWallet.publicKey
                            ? this.walletManager.forget(recipientWallet.publicKey)
                            : this.walletManager.forgetByAddress(recipientWallet.address);
                    }
                    this.logger.error(`[Pool] Cannot apply transaction ${transaction.id} when trying to accept ` +
                        `block ${block.data.id}: ${error.message}`);
                    continue;
                }
            }
            if (senderWallet &&
                this.walletManager.canBePurged(senderWallet) &&
                (await this.getSenderSize(senderPublicKey)) === 0) {
                this.walletManager.forget(senderPublicKey);
            }
        }
        // if delegate in poll wallet manager - apply rewards and fees
        if (this.walletManager.hasByPublicKey(block.data.generatorPublicKey)) {
            const delegateWallet = this.walletManager.findByPublicKey(block.data.generatorPublicKey);
            delegateWallet.balance = delegateWallet.balance.plus(block.data.reward.plus(block.data.totalFee));
        }
        core_container_1.app.resolvePlugin("state")
            .getStore()
            .clearCachedTransactionIds();
    }
    async buildWallets() {
        this.walletManager.reset();
        const transactionIds = await this.getTransactionIdsForForging(0, await this.getPoolSize());
        core_container_1.app.resolvePlugin("state")
            .getStore()
            .clearCachedTransactionIds();
        for (const transactionId of transactionIds) {
            const transaction = await this.getTransaction(transactionId);
            if (!transaction) {
                return;
            }
            const senderWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);
            // TODO: rework error handling
            try {
                const transactionHandler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
                await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet, this.databaseService.walletManager);
                await transactionHandler.applyToSender(transaction, this.walletManager);
            }
            catch (error) {
                this.logger.error(`BuildWallets from pool: ${error.message}`);
                this.purgeByPublicKey(transaction.data.senderPublicKey);
            }
        }
        this.logger.info("Transaction Pool Manager build wallets complete");
    }
    purgeByPublicKey(senderPublicKey) {
        this.logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`);
        this.removeTransactionsForSender(senderPublicKey);
        this.walletManager.forget(senderPublicKey);
    }
    async purgeInvalidTransactions() {
        return this.purgeTransactions(core_event_emitter_1.ApplicationEvents.TransactionPoolRemoved, this.memory.getInvalid());
    }
    async senderHasTransactionsOfType(senderPublicKey, type, typeGroup) {
        await this.purgeExpired();
        if (typeGroup === undefined) {
            typeGroup = crypto_1.Enums.TransactionTypeGroup.Core;
        }
        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            const transactionGroup = transaction.typeGroup === undefined ? crypto_1.Enums.TransactionTypeGroup.Core : transaction.typeGroup;
            if (transaction.type === type && transactionGroup === typeGroup) {
                return true;
            }
        }
        return false;
    }
    async replay(transactions) {
        this.flush();
        this.walletManager.reset();
        for (const transaction of transactions) {
            try {
                const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
                await handler.applyToSender(transaction, this.walletManager);
                await handler.applyToRecipient(transaction, this.walletManager);
                this.memory.remember(transaction);
            }
            catch (error) {
                this.logger.error(`[Pool] Transaction (${transaction.id}): ${error.message}`);
            }
        }
    }
    async getValidatedTransactions(start, size, maxBytes = 0) {
        await this.purgeExpired();
        const data = [];
        let transactionBytes = 0;
        const tempWalletManager = new core_state_1.Wallets.TempWalletManager(this.databaseService.walletManager);
        let i = 0;
        // Copy the returned array because validateTransactions() in the loop body we may remove entries.
        const allTransactions = [
            ...this.memory.sortedByFee(start + size * 10),
        ];
        for (const transaction of allTransactions) {
            if (data.length === size) {
                return data;
            }
            const valid = await this.validateTransactions([transaction], tempWalletManager);
            if (valid.length === 0) {
                continue;
            }
            if (i++ < start) {
                continue;
            }
            if (maxBytes > 0) {
                const transactionSize = transaction.serialized.byteLength;
                if (transactionBytes + transactionSize > maxBytes) {
                    return data;
                }
                transactionBytes += transactionSize;
            }
            data.push(transaction);
        }
        return data;
    }
    async addTransaction(transaction) {
        if (await this.has(transaction.id)) {
            this.logger.debug("Transaction pool: ignoring attempt to add a transaction that is already " +
                `in the pool, id: ${transaction.id}`);
            return { transaction, type: "ERR_ALREADY_IN_POOL", message: "Already in pool" };
        }
        const poolSize = this.memory.count();
        if (this.options.maxTransactionsInPool <= poolSize) {
            // The pool can't accommodate more transactions. Either decline the newcomer or remove
            // an existing transaction from the pool in order to free up space.
            const lowest = this.memory.getLowestFeeLastNonce();
            if (lowest && lowest.data.fee.isLessThan(transaction.data.fee)) {
                await this.walletManager.revertTransactionForSender(lowest);
                this.memory.forget(lowest.data.id, lowest.data.senderPublicKey);
            }
            else {
                return {
                    transaction,
                    type: "ERR_POOL_FULL",
                    message: `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
                        `${transaction.data.fee.toFixed()} is not higher than the lowest fee already in pool ` +
                        `${lowest ? lowest.data.fee.toFixed() : ""}`,
                };
            }
        }
        this.memory.remember(transaction);
        try {
            await this.walletManager.throwIfCannotBeApplied(transaction);
            const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
            await handler.applyToSender(transaction, this.walletManager);
        }
        catch (error) {
            this.logger.error(`[Pool] ${error.message}`);
            this.memory.forget(transaction.id);
            return { transaction, type: "ERR_APPLY", message: error.message };
        }
        this.syncToPersistentStorageIfNecessary();
        return {};
    }
    syncToPersistentStorageIfNecessary() {
        if (this.options.syncInterval <= this.memory.countDirty()) {
            this.syncToPersistentStorage();
        }
    }
    syncToPersistentStorage() {
        this.storage.bulkAdd(this.memory.pullDirtyAdded());
        this.storage.bulkRemoveById(this.memory.pullDirtyRemoved());
    }
    /**
     * Validate the given transactions and return only the valid ones - a subset of the input.
     * The invalid ones are removed from the pool.
     */
    async validateTransactions(transactions, walletManager) {
        const validTransactions = [];
        const forgedIds = await this.removeForgedTransactions(transactions);
        const unforgedTransactions = lodash_differencewith_1.default(transactions, forgedIds, (t, forgedId) => t.id === forgedId);
        if (walletManager === undefined) {
            walletManager = new core_state_1.Wallets.TempWalletManager(this.databaseService.walletManager);
        }
        for (const transaction of unforgedTransactions) {
            try {
                const deserialized = crypto_1.Transactions.TransactionFactory.fromBytes(transaction.serialized);
                assert_1.strictEqual(transaction.id, deserialized.id);
                const handler = await core_transactions_1.Handlers.Registry.get(transaction.type, transaction.typeGroup);
                await handler.applyToSender(transaction, walletManager);
                await handler.applyToRecipient(transaction, walletManager);
                validTransactions.push(transaction);
            }
            catch (error) {
                this.removeTransactionById(transaction.id);
                this.logger.error(`[Pool] Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`);
            }
        }
        return validTransactions;
    }
    async removeForgedTransactions(transactions) {
        const forgedIds = await this.databaseService.getForgedTransactionsIds(transactions.map(({ id }) => id));
        this.removeTransactionsById(forgedIds);
        return forgedIds;
    }
    async purgeExpired() {
        return this.purgeTransactions(core_event_emitter_1.ApplicationEvents.TransactionExpired, this.memory.getExpired());
    }
    /**
     * Remove all provided transactions plus any transactions from the same senders with higher nonces.
     */
    async purgeTransactions(event, transactions) {
        const purge = async (transaction) => {
            this.emitter.emit(event, transaction.data);
            await this.walletManager.revertTransactionForSender(transaction);
            this.memory.forget(transaction.id, transaction.data.senderPublicKey);
            this.syncToPersistentStorageIfNecessary();
        };
        const lowestNonceBySender = {};
        for (const transaction of transactions) {
            if (transaction.data.version === 1) {
                await purge(transaction);
                continue;
            }
            const senderPublicKey = transaction.data.senderPublicKey;
            if (lowestNonceBySender[senderPublicKey] === undefined) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            }
            else if (lowestNonceBySender[senderPublicKey].isGreaterThan(transaction.data.nonce)) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            }
        }
        // Revert all transactions that have bigger or equal nonces than the ones in
        // lowestNonceBySender in order from bigger nonce to smaller nonce.
        for (const senderPublicKey of Object.keys(lowestNonceBySender)) {
            const allTxFromSender = this.memory.getBySender(senderPublicKey).reverse(); // sorted by bigger to smaller nonce
            for (const transaction of allTxFromSender) {
                await purge(transaction);
                if (transaction.data.nonce.isEqualTo(lowestNonceBySender[transaction.data.senderPublicKey])) {
                    break;
                }
            }
        }
    }
}
exports.Connection = Connection;
//# sourceMappingURL=connection.js.map