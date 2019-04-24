import { Crypto, Interfaces, Utils } from "@arkecosystem/crypto";
import assert from "assert";
import { MemoryTransaction } from "./memory-transaction";

export class Memory {
    private sequence: number = 0;
    private all: MemoryTransaction[] = [];
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
    private byId: { [key: string]: MemoryTransaction } = {};
    private bySender: { [key: string]: Set<MemoryTransaction> } = {};
    private byType: { [key: number]: Set<MemoryTransaction> } = {};
    private byExpiration: MemoryTransaction[] = [];
    private byExpirationIsSorted: boolean = true;
    private readonly dirty: { added: Set<string>; removed: Set<string> } = {
        added: new Set(),
        removed: new Set(),
    };

    public allSortedByFee(): MemoryTransaction[] {
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
            this.byExpiration.sort((a, b) => a.expiresAt(maxTransactionAge) - b.expiresAt(maxTransactionAge));
            this.byExpirationIsSorted = true;
        }

        const now: number = Crypto.Slots.getTime();
        const transactions: Interfaces.ITransaction[] = [];

        for (const MemoryTransaction of this.byExpiration) {
            if (MemoryTransaction.expiresAt(maxTransactionAge) >= now) {
                break;
            }

            transactions.push(MemoryTransaction.transaction);
        }

        return transactions;
    }

    public getById(id: string): Interfaces.ITransaction | undefined {
        if (this.byId[id] === undefined) {
            return undefined;
        }

        return this.byId[id].transaction;
    }

    public getByType(type: number): Set<MemoryTransaction> {
        const MemoryTransactions: Set<MemoryTransaction> = this.byType[type];

        if (MemoryTransactions !== undefined) {
            return MemoryTransactions;
        }

        return new Set();
    }

    public getBySender(senderPublicKey: string): Set<MemoryTransaction> {
        const MemoryTransactions: Set<MemoryTransaction> = this.bySender[senderPublicKey];

        if (MemoryTransactions !== undefined) {
            return MemoryTransactions;
        }

        return new Set();
    }

    public remember(MemoryTransaction: MemoryTransaction, maxTransactionAge: number, databaseReady?: boolean): void {
        const transaction: Interfaces.ITransaction = MemoryTransaction.transaction;

        assert.strictEqual(this.byId[transaction.id], undefined);

        if (databaseReady) {
            // Sequence is provided from outside, make sure we avoid duplicates
            // later when we start using our this.sequence.
            assert.strictEqual(typeof MemoryTransaction.sequence, "number");

            this.sequence = Math.max(this.sequence, MemoryTransaction.sequence) + 1;
        } else {
            // Sequence should only be set during DB load (when sequences come
            // from the database). In other scenarios sequence is not set and we
            // set it here.
            MemoryTransaction.sequence = this.sequence++;
        }

        this.all.push(MemoryTransaction);
        this.allIsSorted = false;

        this.byId[transaction.id] = MemoryTransaction;

        const sender: string = transaction.data.senderPublicKey;
        const type: number = transaction.type;

        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Set.
            this.bySender[sender] = new Set([MemoryTransaction]);
        } else {
            // Append to existing transaction ids for this sender.
            this.bySender[sender].add(MemoryTransaction);
        }

        if (this.byType[type] === undefined) {
            // First transaction of this type, create a new Set.
            this.byType[type] = new Set([MemoryTransaction]);
        } else {
            // Append to existing transaction ids for this type.
            this.byType[type].add(MemoryTransaction);
        }

        if (MemoryTransaction.expiresAt(maxTransactionAge) !== null) {
            this.byExpiration.push(MemoryTransaction);
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

        const MemoryTransaction: MemoryTransaction = this.byId[id];
        const type: number = this.byId[id].transaction.type;

        // XXX worst case: O(n)
        let i: number = this.byExpiration.findIndex(e => e.transaction.id === id);
        if (i !== -1) {
            this.byExpiration.splice(i, 1);
        }

        this.bySender[senderPublicKey].delete(MemoryTransaction);
        if (this.bySender[senderPublicKey].size === 0) {
            delete this.bySender[senderPublicKey];
        }

        this.byType[type].delete(MemoryTransaction);
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

    public pullDirtyAdded(): MemoryTransaction[] {
        const added: MemoryTransaction[] = [];

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
}
