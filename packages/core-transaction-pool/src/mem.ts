import { Bignum, slots, Transaction } from "@arkecosystem/crypto";
import assert from "assert";
import { MemPoolTransaction } from "./mem-pool-transaction";

export class Mem {
    public sequence: number;
    public all: MemPoolTransaction[];
    public allIsSorted: boolean;
    public byId: { [key: string]: MemPoolTransaction };
    public bySender: { [key: string]: Set<MemPoolTransaction> };
    public byType: { [key: number]: Set<MemPoolTransaction> };
    public byExpiration: MemPoolTransaction[];
    public byExpirationIsSorted: boolean;
    public dirty: { added: Set<string>; removed: Set<string> };

    /**
     * Create the in-memory transaction pool structures.
     */
    constructor() {
        /**
         * A monotonically increasing number, assigned to each new transaction and
         * then incremented.
         * Used to:
         * - keep insertion order.
         */
        this.sequence = 0;

        /**
         * An array of MemPoolTransaction sorted by fee (the transaction with the
         * highest fee is first). If the fee is equal, they are sorted by insertion
         * order.
         * Used to:
         * - get the transactions with the highest fee
         * - get the number of all transactions in the pool
         */
        this.all = [];

        /**
         * A boolean flag indicating whether `this.all` is indeed sorted or
         * temporarily left unsorted. We use lazy sorting of `this.all`:
         * - insertion just appends at the end (O(1)) + flag it as unsorted
         * - deletion removes by using splice() (O(n)) + flag it as unsorted
         * - lookup sorts if it is not sorted (O(n*log(n)) + flag it as sorted
         */
        this.allIsSorted = true;

        /**
         * A map of (key=transaction id, value=MemPoolTransaction).
         * Used to:
         * - get a transaction, given its ID
         */
        this.byId = {};

        /**
         * A map of (key=sender public key, value=Set of MemPoolTransaction).
         * Used to:
         * - get all transactions from a given sender
         * - get the number of all transactions from a given sender.
         */
        this.bySender = {};

        /**
         * A map of (key=transaction type, value=Set of MemPoolTransaction).
         * Used to:
         * - get all transactions of a given type
         */
        this.byType = {};

        /**
         * An array of MemPoolTransaction, sorted by expiration (earliest date
         * comes first). This array may not contain all transactions that are
         * in the pool, transactions that are without expiration are not included.
         * Used to:
         * - find all transactions that have expired (have an expiration date
         *   earlier than a given date) - they are at the beginning of the array.
         */
        this.byExpiration = [];
        this.byExpirationIsSorted = true;

        /**
         * List of dirty transactions ids (that are not saved in the on-disk
         * database yet). Used to delay and group operations to the on-disk database.
         */
        this.dirty = {
            added: new Set(),
            removed: new Set(),
        };
    }

    /**
     * Add a transaction.
     * @param {MemPoolTransaction} memPoolTransaction transaction to add
     * @param {Number}             maxTransactionAge  maximum age of a transaction in seconds
     * @param {Boolean}            thisIsDBLoad       if true, then this is the initial
     *                                                loading from the database and we do
     *                                                not need to schedule the transaction
     *                                                that is being added for saving to disk
     */
    public add(memPoolTransaction: MemPoolTransaction, maxTransactionAge: number, thisIsDBLoad?: boolean) {
        const transaction = memPoolTransaction.transaction;

        assert.strictEqual(this.byId[transaction.id], undefined);

        if (thisIsDBLoad) {
            // Sequence is provided from outside, make sure we avoid duplicates
            // later when we start using our this.sequence.
            assert.strictEqual(typeof memPoolTransaction.sequence, "number");
            this.sequence = Math.max(this.sequence, memPoolTransaction.sequence) + 1;
        } else {
            // Sequence should only be set during DB load (when sequences come
            // from the database). In other scenarios sequence is not set and we
            // set it here.
            memPoolTransaction.sequence = this.sequence++;
        }

        this.all.push(memPoolTransaction);
        this.allIsSorted = false;

        this.byId[transaction.id] = memPoolTransaction;

        const sender = transaction.data.senderPublicKey;
        const type = transaction.type;

        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Set.
            this.bySender[sender] = new Set([memPoolTransaction]);
        } else {
            // Append to existing transaction ids for this sender.
            this.bySender[sender].add(memPoolTransaction);
        }

        if (this.byType[type] === undefined) {
            // First transaction of this type, create a new Set.
            this.byType[type] = new Set([memPoolTransaction]);
        } else {
            // Append to existing transaction ids for this type.
            this.byType[type].add(memPoolTransaction);
        }

        if (memPoolTransaction.expireAt(maxTransactionAge) !== null) {
            this.byExpiration.push(memPoolTransaction);
            this.byExpirationIsSorted = false;
        }

        if (!thisIsDBLoad) {
            if (this.dirty.removed.has(transaction.id)) {
                // If the transaction has been already in the pool and has been removed
                // and the removal has not propagated to disk yet, just wipe it from the
                // list of removed transactions, so that the old copy stays on disk.
                this.dirty.removed.delete(transaction.id);
            } else {
                this.dirty.added.add(transaction.id);
            }
        }
    }

    /**
     * Remove a transaction.
     */
    public remove(id: string, senderPublicKey?: string) {
        if (this.byId[id] === undefined) {
            // Not found, not in pool
            return;
        }

        if (senderPublicKey === undefined) {
            senderPublicKey = this.byId[id].transaction.data.senderPublicKey;
        }

        const memPoolTransaction = this.byId[id];
        const type = this.byId[id].transaction.type;

        // XXX worst case: O(n)
        let i = this.byExpiration.findIndex(e => e.transaction.id === id);
        if (i !== -1) {
            this.byExpiration.splice(i, 1);
        }

        this.bySender[senderPublicKey].delete(memPoolTransaction);
        if (this.bySender[senderPublicKey].size === 0) {
            delete this.bySender[senderPublicKey];
        }

        this.byType[type].delete(memPoolTransaction);
        if (this.byType[type].size === 0) {
            delete this.byType[type];
        }

        delete this.byId[id];

        i = this.all.findIndex(e => e.transaction.id === id);
        assert.notStrictEqual(i, -1);
        this.all.splice(i, 1);
        this.allIsSorted = false;

        if (this.dirty.added.has(id)) {
            // This transaction has been added and deleted without data being synced
            // to disk in between, so it will never touch the disk, just remove it
            // from the added list.
            this.dirty.added.delete(id);
        } else {
            this.dirty.removed.add(id);
        }
    }

    /**
     * Get the number of transactions.
     */
    public getSize(): number {
        return this.all.length;
    }

    /**
     * Get all transactions from a given sender.
     */
    public getBySender(senderPublicKey: string): Set<MemPoolTransaction> {
        const memPoolTransactions = this.bySender[senderPublicKey];
        if (memPoolTransactions !== undefined) {
            return memPoolTransactions;
        }
        return new Set();
    }

    /**
     * Get all transactions of a given type.
     * @param {Number} type of transaction
     * @return {Set of MemPoolTransaction} all transactions of the given type, could be empty Set
     */
    public getByType(type) {
        const memPoolTransactions = this.byType[type];
        if (memPoolTransactions !== undefined) {
            return memPoolTransactions;
        }
        return new Set();
    }

    /**
     * Get a transaction, given its id.
     */
    public getTransactionById(id: string): Transaction | undefined {
        if (this.byId[id] === undefined) {
            return undefined;
        }
        return this.byId[id].transaction;
    }

    /**
     * Get an array of all transactions ordered by fee.
     * Transactions are ordered by fee (highest fee first) or by
     * insertion time, if fees equal (earliest transaction first).
     */
    public getTransactionsOrderedByFee(): MemPoolTransaction[] {
        if (!this.allIsSorted) {
            this.all.sort((a, b) => {
                const feeA = a.transaction.data.fee as Bignum;
                const feeB = b.transaction.data.fee as Bignum;
                if (feeA.isGreaterThan(feeB)) {
                    return -1;
                }
                if (feeA.isLessThan(feeB)) {
                    return 1;
                }
                return a.sequence - b.sequence;
            });
            this.allIsSorted = true;
        }

        return this.all;
    }

    /**
     * Check if a transaction with a given id exists.
     */
    public transactionExists(id: string): boolean {
        return this.byId[id] !== undefined;
    }

    /**
     * Get the expired transactions.
     */
    public getExpired(maxTransactionAge: number): Transaction[] {
        if (!this.byExpirationIsSorted) {
            this.byExpiration.sort((a, b) => a.expireAt(maxTransactionAge) - b.expireAt(maxTransactionAge));
            this.byExpirationIsSorted = true;
        }

        const now = slots.getTime();

        const transactions = [];

        for (const memPoolTransaction of this.byExpiration) {
            if (memPoolTransaction.expireAt(maxTransactionAge) <= now) {
                transactions.push(memPoolTransaction.transaction);
            } else {
                break;
            }
        }

        return transactions;
    }

    /**
     * Remove all transactions.
     */
    public flush() {
        this.all = [];
        this.allIsSorted = true;
        this.byId = {};
        this.bySender = {};
        this.byType = {};
        this.byExpiration = [];
        this.byExpirationIsSorted = true;
        this.dirty.added.clear();
        this.dirty.removed.clear();
    }

    /**
     * Get the number of dirty transactions (added or removed, but those additions or
     * removals have not been applied to the persistent storage).
     */
    public getNumberOfDirty(): number {
        return this.dirty.added.size + this.dirty.removed.size;
    }

    /**
     * Get the dirty transactions that were added and forget they are dirty.
     * In other words, get the transactions that were added since the last
     * call to this method (or to the flush() method).
     */
    public getDirtyAddedAndForget(): MemPoolTransaction[] {
        const added: MemPoolTransaction[] = [];
        this.dirty.added.forEach(id => added.push(this.byId[id]));
        this.dirty.added.clear();
        return added;
    }

    /**
     * Get the ids of dirty transactions that were removed and forget them completely.
     * In other words, get the transactions that were removed since the last
     * call to this method (or to the flush() method).
     */
    public getDirtyRemovedAndForget(): string[] {
        const removed = Array.from(this.dirty.removed);
        this.dirty.removed.clear();
        return removed;
    }
}
