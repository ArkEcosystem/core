import { app } from "@arkecosystem/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";
import assert from "assert";
import { SequentialTransaction } from "./sequential-transaction";

export class Memory {
    private sequence: number = 0;
    private all: SequentialTransaction[] = [];
    /**
     * A boolean flag indicating whether `this.all` is indeed sorted or
     * temporarily left unsorted. We use lazy sorting of `this.all`:
     * - insertion just appends at the end (O(1)) + flag it as unsorted
     * - deletion removes by using splice() (O(n)) + flag it as unsorted
     * - lookup sorts if it is not sorted (O(n*log(n)) + flag it as sorted
     *
     * @TODO: remove the need for a comment
     */
    private allIsSorted: boolean = true;
    private byId: { [key: string]: SequentialTransaction } = {};
    private bySender: { [key: string]: Set<SequentialTransaction> } = {};
    private byType: { [key: number]: Set<SequentialTransaction> } = {};
    /**
     * An array of transactions, sorted by expiration (lower height comes first).
     * This array may not contain all transactions that are in the pool,
     * transactions that are without expiration are not included. Used to:
     * - find all transactions that have expired (have an expiration height
     *   lower than the current height) - they are at the beginning of the array.
     */
    private byExpiration: SequentialTransaction[] = [];
    private byExpirationIsSorted: boolean = true;
    private readonly dirty: { added: Set<string>; removed: Set<string> } = {
        added: new Set(),
        removed: new Set(),
    };

    public allSortedByFee(): SequentialTransaction[] {
        if (!this.allIsSorted) {
            this.all.sort((a, b) => {
                const feeA: Utils.BigNumber = a.transaction.data.fee;
                const feeB: Utils.BigNumber = b.transaction.data.fee;

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

    public getExpired(maxTransactionAge: number): Interfaces.ITransaction[] {
        if (!this.byExpirationIsSorted) {
            this.byExpiration.sort((a, b) => a.transaction.data.expiration - b.transaction.data.expiration);
            this.byExpirationIsSorted = true;
        }

        const currentHeight: number = this.currentHeight();
        const transactions: Interfaces.ITransaction[] = [];

        for (const SequentialTransaction of this.byExpiration) {
            if (SequentialTransaction.transaction.data.expiration === 0) {
                SequentialTransaction.transaction.data.expiration = currentHeight + maxTransactionAge;
                this.byExpirationIsSorted = false;
                continue;
            }

            if (SequentialTransaction.transaction.data.expiration > currentHeight) {
                break;
            }

            transactions.push(SequentialTransaction.transaction);
        }

        return transactions;
    }

    public getById(id: string): Interfaces.ITransaction | undefined {
        if (this.byId[id] === undefined) {
            return undefined;
        }

        return this.byId[id].transaction;
    }

    public getByType(type: number): Set<SequentialTransaction> {
        const SequentialTransactions: Set<SequentialTransaction> = this.byType[type];

        if (SequentialTransactions !== undefined) {
            return SequentialTransactions;
        }

        return new Set();
    }

    public getBySender(senderPublicKey: string): Set<SequentialTransaction> {
        const SequentialTransactions: Set<SequentialTransaction> = this.bySender[senderPublicKey];

        if (SequentialTransactions !== undefined) {
            return SequentialTransactions;
        }

        return new Set();
    }

    public remember(
        SequentialTransaction: SequentialTransaction,
        maxTransactionAge: number,
        databaseReady?: boolean,
    ): void {
        const transaction: Interfaces.ITransaction = SequentialTransaction.transaction;

        assert.strictEqual(this.byId[transaction.id], undefined);

        if (databaseReady) {
            // Sequence is provided from outside, make sure we avoid duplicates
            // later when we start using our this.sequence.
            assert.strictEqual(typeof SequentialTransaction.sequence, "number");

            this.sequence = Math.max(this.sequence, SequentialTransaction.sequence) + 1;
        } else {
            // Sequence should only be set during DB load (when sequences come
            // from the database). In other scenarios sequence is not set and we
            // set it here.
            SequentialTransaction.sequence = this.sequence++;
        }

        this.all.push(SequentialTransaction);
        this.allIsSorted = false;

        this.byId[transaction.id] = SequentialTransaction;

        const sender: string = transaction.data.senderPublicKey;
        const type: number = transaction.type;

        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Set.
            this.bySender[sender] = new Set([SequentialTransaction]);
        } else {
            // Append to existing transaction ids for this sender.
            this.bySender[sender].add(SequentialTransaction);
        }

        if (this.byType[type] === undefined) {
            // First transaction of this type, create a new Set.
            this.byType[type] = new Set([SequentialTransaction]);
        } else {
            // Append to existing transaction ids for this type.
            this.byType[type].add(SequentialTransaction);
        }

        if (type !== Enums.TransactionTypes.TimelockTransfer) {
            const maxHeight: number = this.currentHeight() + maxTransactionAge;
            if (
                typeof SequentialTransaction.transaction.data.expiration !== "number" ||
                SequentialTransaction.transaction.data.expiration === 0 ||
                SequentialTransaction.transaction.data.expiration > maxHeight
            ) {
                SequentialTransaction.transaction.data.expiration = maxHeight;
            }
            this.byExpiration.push(SequentialTransaction);
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
            senderPublicKey = this.byId[id].transaction.data.senderPublicKey;
        }

        const SequentialTransaction: SequentialTransaction = this.byId[id];
        const type: number = this.byId[id].transaction.type;

        // XXX worst case: O(n)
        let i: number = this.byExpiration.findIndex(e => e.transaction.id === id);
        if (i !== -1) {
            this.byExpiration.splice(i, 1);
        }

        this.bySender[senderPublicKey].delete(SequentialTransaction);
        if (this.bySender[senderPublicKey].size === 0) {
            delete this.bySender[senderPublicKey];
        }

        this.byType[type].delete(SequentialTransaction);
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

    public has(id: string): boolean {
        return this.byId[id] !== undefined;
    }

    public flush(): void {
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

    public count(): number {
        return this.all.length;
    }

    public countDirty(): number {
        return this.dirty.added.size + this.dirty.removed.size;
    }

    public pullDirtyAdded(): SequentialTransaction[] {
        const added: SequentialTransaction[] = [];

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

    private currentHeight(): number {
        return app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastHeight();
    }
}
