import { app } from "@arkecosystem/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { expirationCalculator, SortedArray } from "@arkecosystem/core-utils";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";

export class Memory {
    /**
     * An array of all transactions, possibly sorted by fee (highest fee first).
     * We use lazy sorting:
     * - insertion just appends at the end, complexity: O(1) + flag it as unsorted
     * - deletion removes by using splice(), complexity: O(n) + flag it as unsorted
     * - lookup sorts if it is not sorted, complexity: O(n*log(n) + flag it as sorted
     */
    private all: Interfaces.ITransaction[] = [];
    private allIsSorted: boolean = true;
    private byId: { [key: string]: Interfaces.ITransaction } = {};
    private bySender: { [key: string]: SortedArray<Interfaces.ITransaction> } = {};
    private byType: Map<Transactions.InternalTransactionType, Set<Interfaces.ITransaction>> = new Map();

    private byFee: SortedArray<Interfaces.ITransaction> = new SortedArray(
        (a: Interfaces.ITransaction, b: Interfaces.ITransaction) => {
            if (a.data.fee.isGreaterThan(b.data.fee)) {
                return -1;
            }
            if (a.data.fee.isLessThan(b.data.fee)) {
                return 1;
            }
            return 0;
        },
    );

    /**
     * Contains only transactions that expire, possibly sorted by height (lower first).
     */
    private byExpiration: Interfaces.ITransaction[] = [];
    private byExpirationIsSorted: boolean = true;
    private readonly dirty: { added: Set<string>; removed: Set<string> } = {
        added: new Set(),
        removed: new Set(),
    };

    constructor(private readonly maxTransactionAge: number) {}

    public sortedByFee(limit?: number): Interfaces.ITransaction[] {
        if (!this.allIsSorted) {
            if (limit) {
                return this.sort(limit);
            }
            this.all = this.sort();
            this.allIsSorted = true;
        }

        return this.all;
    }

    public getExpired(): Interfaces.ITransaction[] {
        const currentHeight: number = this.currentHeight();
        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: this.maxTransactionAge,
        };

        if (!this.byExpirationIsSorted) {
            this.byExpiration.sort(
                (a, b) =>
                    expirationCalculator.calculateTransactionExpiration(a.data, expirationContext) -
                    expirationCalculator.calculateTransactionExpiration(b.data, expirationContext),
            );
            this.byExpirationIsSorted = true;
        }

        const transactions: Interfaces.ITransaction[] = [];

        for (const transaction of this.byExpiration) {
            if (
                expirationCalculator.calculateTransactionExpiration(transaction.data, expirationContext) > currentHeight
            ) {
                break;
            }

            transactions.push(transaction);
        }

        return transactions;
    }

    public getInvalid(): Interfaces.ITransaction[] {
        const transactions: Interfaces.ITransaction[] = [];

        for (const transaction of Object.values(this.byId)) {
            const { error } = transaction.verifySchema();

            if (error) {
                transactions.push(transaction);
            }
        }

        return transactions;
    }

    public getById(id: string): Interfaces.ITransaction | undefined {
        if (this.byId[id] === undefined) {
            return undefined;
        }

        return this.byId[id];
    }

    public getByType(type: number, typeGroup: number): Set<Interfaces.ITransaction> {
        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );

        if (this.byType.has(internalType)) {
            return this.byType.get(internalType);
        }

        return new Set();
    }

    public getBySender(senderPublicKey: string): Interfaces.ITransaction[] {
        if (this.bySender[senderPublicKey] !== undefined) {
            return this.bySender[senderPublicKey].getAll();
        }

        return [];
    }

    public getLowestFeeLastNonce(): Interfaces.ITransaction | undefined {
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
        let lowestFeeTx: Interfaces.ITransaction;
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

    public remember(transaction: Interfaces.ITransaction, databaseReady?: boolean): void {
        assert.strictEqual(this.byId[transaction.id], undefined);

        this.all.push(transaction);
        this.allIsSorted = false;

        this.byFee.insert(transaction);

        this.byId[transaction.id] = transaction;

        const sender: string = transaction.data.senderPublicKey;
        const { type, typeGroup } = transaction;

        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Tree.
            this.bySender[sender] = new SortedArray((a: Interfaces.ITransaction, b: Interfaces.ITransaction) => {
                // if no nonce (v1 transactions), default to BigNumber.ZERO to still be able to use the sorted array
                const nonceA = a.data.nonce || Utils.BigNumber.ZERO;
                const nonceB = b.data.nonce || Utils.BigNumber.ZERO;
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

        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        if (this.byType.has(internalType)) {
            // Append to existing transaction ids for this type.
            this.byType.get(internalType).add(transaction);
        } else {
            // First transaction of this type, create a new Set.
            this.byType.set(internalType, new Set([transaction]));
        }

        const currentHeight: number = this.currentHeight();
        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: this.maxTransactionAge,
        };
        const expiration: number = expirationCalculator.calculateTransactionExpiration(
            transaction.data,
            expirationContext,
        );
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
            } else {
                this.dirty.added.add(transaction.id);
            }
        }
    }

    public forget(id: string, senderPublicKey?: string): void {
        if (this.byId[id] === undefined) {
            return;
        }

        if (senderPublicKey === undefined) {
            senderPublicKey = this.byId[id].data.senderPublicKey;
        }

        const transaction: Interfaces.ITransaction = this.byId[id];
        const { type, typeGroup } = this.byId[id];

        const byFeeIndex = this.byFee.findIndex(tx => tx.id === transaction.id);
        this.byFee.removeAtIndex(byFeeIndex);

        // XXX worst case: O(n)
        let i: number = this.byExpiration.findIndex(e => e.id === id);
        if (i !== -1) {
            this.byExpiration.splice(i, 1);
        }

        const bySenderIndex = this.bySender[senderPublicKey].findIndex(tx => tx.id === transaction.id);
        this.bySender[senderPublicKey].removeAtIndex(bySenderIndex);
        if (this.bySender[senderPublicKey].isEmpty()) {
            delete this.bySender[senderPublicKey];
        }

        const internalType: Transactions.InternalTransactionType = Transactions.InternalTransactionType.from(
            type,
            typeGroup,
        );
        this.byType.get(internalType).delete(transaction);
        if (this.byType.get(internalType).size === 0) {
            this.byType.delete(internalType);
        }

        delete this.byId[id];

        i = this.all.findIndex(e => e.id === id);
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

    public has(id: string): boolean {
        return this.byId[id] !== undefined;
    }

    public flush(): void {
        this.all = [];
        this.allIsSorted = true;
        this.byFee = new SortedArray(this.byFee.getCompareFunction());
        this.byId = {};
        this.bySender = {};
        this.byType.clear();
        this.byExpiration = [];
        this.byExpirationIsSorted = true;
        this.dirty.added.clear();
        this.dirty.removed.clear();
    }

    public count(): number {
        return this.all.length;
    }

    public countDirty(): number {
        return this.dirty.added.size + this.dirty.removed.size;
    }

    public pullDirtyAdded(): Interfaces.ITransaction[] {
        const added: Interfaces.ITransaction[] = [];

        for (const id of this.dirty.added) {
            added.push(this.byId[id]);
        }

        this.dirty.added.clear();

        return added;
    }

    public pullDirtyRemoved(): string[] {
        const removed: string[] = Array.from(this.dirty.removed);
        this.dirty.removed.clear();

        return removed;
    }

    /**
     * Sort `this.all` by fee (highest fee first) with the exception that transactions
     * from the same sender must be ordered lowest `nonce` first.
     */
    private sort(limit?: number): Interfaces.ITransaction[] {
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

            const sender: string = transaction.data.senderPublicKey;
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

    private currentHeight(): number {
        return app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastHeight();
    }
}
