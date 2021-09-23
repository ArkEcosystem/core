"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
class Memory {
    constructor(maxTransactionAge) {
        this.maxTransactionAge = maxTransactionAge;
        /**
         * An array of all transactions, possibly sorted by fee (highest fee first).
         * We use lazy sorting:
         * - insertion just appends at the end, complexity: O(1) + flag it as unsorted
         * - deletion removes by using splice(), complexity: O(n) + flag it as unsorted
         * - lookup sorts if it is not sorted, complexity: O(n*log(n) + flag it as sorted
         */
        this.all = [];
        this.allIsSorted = true;
        this.byId = {};
        this.bySender = {};
        this.byType = new Map();
        this.byFee = new core_utils_1.SortedArray((a, b) => {
            if (a.data.fee.isGreaterThan(b.data.fee)) {
                return -1;
            }
            if (a.data.fee.isLessThan(b.data.fee)) {
                return 1;
            }
            return 0;
        });
        /**
         * Contains only transactions that expire, possibly sorted by height (lower first).
         */
        this.byExpiration = [];
        this.byExpirationIsSorted = true;
        this.dirty = {
            added: new Set(),
            removed: new Set(),
        };
    }
    sortedByFee(limit) {
        if (!this.allIsSorted) {
            if (limit) {
                return this.sort(limit);
            }
            this.all = this.sort();
            this.allIsSorted = true;
        }
        return this.all;
    }
    getExpired() {
        const currentHeight = this.currentHeight();
        const expirationContext = {
            blockTime: crypto_1.Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: crypto_1.Crypto.Slots.getTime(),
            maxTransactionAge: this.maxTransactionAge,
        };
        if (!this.byExpirationIsSorted) {
            this.byExpiration.sort((a, b) => core_utils_1.expirationCalculator.calculateTransactionExpiration(a.data, expirationContext) -
                core_utils_1.expirationCalculator.calculateTransactionExpiration(b.data, expirationContext));
            this.byExpirationIsSorted = true;
        }
        const transactions = [];
        for (const transaction of this.byExpiration) {
            if (core_utils_1.expirationCalculator.calculateTransactionExpiration(transaction.data, expirationContext) > currentHeight) {
                break;
            }
            transactions.push(transaction);
        }
        return transactions;
    }
    getInvalid() {
        const transactions = [];
        for (const transaction of Object.values(this.byId)) {
            const { error } = transaction.verifySchema();
            if (error) {
                transactions.push(transaction);
            }
        }
        return transactions;
    }
    getById(id) {
        if (this.byId[id] === undefined) {
            return undefined;
        }
        return this.byId[id];
    }
    getByType(type, typeGroup) {
        const internalType = crypto_1.Transactions.InternalTransactionType.from(type, typeGroup);
        if (this.byType.has(internalType)) {
            return this.byType.get(internalType);
        }
        return new Set();
    }
    getBySender(senderPublicKey) {
        if (this.bySender[senderPublicKey] !== undefined) {
            return this.bySender[senderPublicKey].getAll();
        }
        return [];
    }
    getLowestFeeLastNonce() {
        // Algorithm : get the lowest fees transactions : if one of them happen to be the last nonce
        // of the sender, then return it (try that for the 100 lowest fee transactions)
        // if not, just fetch 100 "last nonce txs" and return the lowest fee one (it might not be the
        // lowest "last nonce tx" among all the pool - we don't want to go through all the pool for
        // performance reasons - but it's important to return a transaction so that new transactions
        // can be accepted into the pool when it is full if they have a high enough fee)
        const maxTxsToFetch = 100;
        const all = this.byFee.getAll();
        const lowestFeeTxs = all.slice(Math.max(all.length - maxTxsToFetch, 0)).reverse();
        for (const transaction of lowestFeeTxs) {
            const allBySameSender = this.bySender[transaction.data.senderPublicKey].getAll();
            const lastByNonceSameSender = allBySameSender[allBySameSender.length - 1];
            if (lastByNonceSameSender && lastByNonceSameSender.id === transaction.id) {
                return transaction;
            }
        }
        // if we didn't find a "last nonce tx" among the lowest fee transactions, fetch
        // the first 100 "last nonce tx" by sender and return the lowest fee one
        let lowestFeeTx;
        for (const bySender of Object.values(this.bySender).slice(0, maxTxsToFetch)) {
            const txsBySender = bySender.getAll();
            const lastNonceTxBySender = txsBySender[txsBySender.length - 1];
            lowestFeeTx = lowestFeeTx
                ? lastNonceTxBySender.data.fee.isLessThan(lowestFeeTx.data.nonce)
                    ? lastNonceTxBySender
                    : lowestFeeTx
                : lastNonceTxBySender;
        }
        return lowestFeeTx;
    }
    remember(transaction, databaseReady) {
        assert_1.default.strictEqual(this.byId[transaction.id], undefined);
        this.all.push(transaction);
        this.allIsSorted = false;
        this.byFee.insert(transaction);
        this.byId[transaction.id] = transaction;
        const sender = transaction.data.senderPublicKey;
        const { type, typeGroup } = transaction;
        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Tree.
            this.bySender[sender] = new core_utils_1.SortedArray((a, b) => {
                // if no nonce (v1 transactions), default to BigNumber.ZERO to still be able to use the sorted array
                const nonceA = a.data.nonce || crypto_1.Utils.BigNumber.ZERO;
                const nonceB = b.data.nonce || crypto_1.Utils.BigNumber.ZERO;
                if (nonceA.isGreaterThan(nonceB)) {
                    return 1;
                }
                if (nonceA.isLessThan(nonceB)) {
                    return -1;
                }
                return 0;
            });
        }
        // Append to existing transaction ids for this sender.
        this.bySender[sender].insert(transaction);
        const internalType = crypto_1.Transactions.InternalTransactionType.from(type, typeGroup);
        if (this.byType.has(internalType)) {
            // Append to existing transaction ids for this type.
            this.byType.get(internalType).add(transaction);
        }
        else {
            // First transaction of this type, create a new Set.
            this.byType.set(internalType, new Set([transaction]));
        }
        const currentHeight = this.currentHeight();
        const expirationContext = {
            blockTime: crypto_1.Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: crypto_1.Crypto.Slots.getTime(),
            maxTransactionAge: this.maxTransactionAge,
        };
        const expiration = core_utils_1.expirationCalculator.calculateTransactionExpiration(transaction.data, expirationContext);
        if (expiration !== null) {
            this.byExpiration.push(transaction);
            this.byExpirationIsSorted = false;
        }
        if (!databaseReady) {
            if (this.dirty.removed.has(transaction.id)) {
                // If the transaction has been already in the pool and has been removed
                // and the removal has not propagated to disk yet, just wipe it from the
                // list of removed transactions, so that the old copy stays on disk.
                this.dirty.removed.delete(transaction.id);
            }
            else {
                this.dirty.added.add(transaction.id);
            }
        }
    }
    forget(id, senderPublicKey) {
        if (this.byId[id] === undefined) {
            return;
        }
        if (senderPublicKey === undefined) {
            senderPublicKey = this.byId[id].data.senderPublicKey;
        }
        const transaction = this.byId[id];
        const { type, typeGroup } = this.byId[id];
        const byFeeIndex = this.byFee.findIndex(tx => tx.id === transaction.id);
        this.byFee.removeAtIndex(byFeeIndex);
        // XXX worst case: O(n)
        let i = this.byExpiration.findIndex(e => e.id === id);
        if (i !== -1) {
            this.byExpiration.splice(i, 1);
        }
        const bySenderIndex = this.bySender[senderPublicKey].findIndex(tx => tx.id === transaction.id);
        this.bySender[senderPublicKey].removeAtIndex(bySenderIndex);
        if (this.bySender[senderPublicKey].isEmpty()) {
            delete this.bySender[senderPublicKey];
        }
        const internalType = crypto_1.Transactions.InternalTransactionType.from(type, typeGroup);
        this.byType.get(internalType).delete(transaction);
        if (this.byType.get(internalType).size === 0) {
            this.byType.delete(internalType);
        }
        delete this.byId[id];
        i = this.all.findIndex(e => e.id === id);
        assert_1.default.notStrictEqual(i, -1);
        this.all.splice(i, 1);
        this.allIsSorted = false;
        if (this.dirty.added.has(id)) {
            // This transaction has been added and deleted without data being synced
            // to disk in between, so it will never touch the disk, just remove it
            // from the added list.
            this.dirty.added.delete(id);
        }
        else {
            this.dirty.removed.add(id);
        }
    }
    has(id) {
        return this.byId[id] !== undefined;
    }
    flush() {
        this.all = [];
        this.allIsSorted = true;
        this.byFee = new core_utils_1.SortedArray(this.byFee.getCompareFunction());
        this.byId = {};
        this.bySender = {};
        this.byType.clear();
        this.byExpiration = [];
        this.byExpirationIsSorted = true;
        this.dirty.added.clear();
        this.dirty.removed.clear();
    }
    count() {
        return this.all.length;
    }
    countDirty() {
        return this.dirty.added.size + this.dirty.removed.size;
    }
    pullDirtyAdded() {
        const added = [];
        for (const id of this.dirty.added) {
            added.push(this.byId[id]);
        }
        this.dirty.added.clear();
        return added;
    }
    pullDirtyRemoved() {
        const removed = Array.from(this.dirty.removed);
        this.dirty.removed.clear();
        return removed;
    }
    /**
     * Sort `this.all` by fee (highest fee first) with the exception that transactions
     * from the same sender must be ordered lowest `nonce` first.
     */
    sort(limit) {
        const sortedByFee = this.byFee.getAll();
        const sortedByFeeAndNonce = [];
        const lastAddedBySender = {};
        const txsToIgnore = {};
        for (const transaction of sortedByFee) {
            if (transaction.data.version < 2) {
                sortedByFeeAndNonce.push(transaction);
                continue;
            }
            if (txsToIgnore[transaction.id]) {
                continue;
            }
            const sender = transaction.data.senderPublicKey;
            const lowerNonceTxsForSender = lastAddedBySender[sender]
                ? this.bySender[sender].getStrictlyBetween(lastAddedBySender[sender], transaction)
                : this.bySender[sender].getStrictlyBelow(transaction);
            for (const lowerNonceTx of lowerNonceTxsForSender) {
                txsToIgnore[lowerNonceTx.id] = lowerNonceTx;
                sortedByFeeAndNonce.push(lowerNonceTx);
            }
            sortedByFeeAndNonce.push(transaction);
            lastAddedBySender[sender] = transaction;
            if (limit && sortedByFeeAndNonce.length >= limit) {
                break;
            }
        }
        return sortedByFeeAndNonce;
    }
    currentHeight() {
        return core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastHeight();
    }
}
exports.Memory = Memory;
//# sourceMappingURL=memory.js.map