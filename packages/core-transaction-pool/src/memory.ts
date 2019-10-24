import { app, Container, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";

// todo: review implementation and reduce the complexity of all methods as it is quite high
export class Memory {
    /**
     * An array of all transactions, possibly sorted by fee (highest fee first).
     * We use lazy sorting:
     * - insertion just appends at the end, complexity: O(1) + flag it as unsorted
     * - deletion removes by using splice(), complexity: O(n) + flag it as unsorted
     * - lookup sorts if it is not sorted, complexity: O(n*log(n) + flag it as sorted
     */
    private all: Interfaces.ITransaction[] = [];

    private allIsSorted = true;

    private byId: { [key: string]: Interfaces.ITransaction } = {};

    private bySender: { [key: string]: Set<Interfaces.ITransaction> } = {};
    private byType: Map<Transactions.InternalTransactionType, Set<Interfaces.ITransaction>> = new Map();

    /**
     * Contains only transactions that expire, possibly sorted by height (lower first).
     */
    private byExpiration: Interfaces.ITransaction[] = [];

    private byExpirationIsSorted = true;

    private readonly dirty: { added: Set<string>; removed: Set<string> } = {
        added: new Set(),
        removed: new Set(),
    };

    public constructor(private readonly maxTransactionAge: number) {}

    public allSortedByFee(): Interfaces.ITransaction[] {
        if (!this.allIsSorted) {
            this.sortAll();
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
            this.byExpiration.sort((a, b) => {
                const expirationA: number = AppUtils.assert.defined(
                    AppUtils.expirationCalculator.calculateTransactionExpiration(a.data, expirationContext),
                );

                const expirationB: number = AppUtils.assert.defined(
                    AppUtils.expirationCalculator.calculateTransactionExpiration(b.data, expirationContext),
                );

                return expirationA - expirationB;
            });

            this.byExpirationIsSorted = true;
        }

        const transactions: Interfaces.ITransaction[] = [];

        for (const transaction of this.byExpiration) {
            const expiration: number = AppUtils.assert.defined(
                AppUtils.expirationCalculator.calculateTransactionExpiration(transaction.data, expirationContext),
            );

            if (expiration > currentHeight) {
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
        const internalType: Transactions.InternalTransactionType = AppUtils.assert.defined(
            Transactions.InternalTransactionType.from(type, typeGroup),
        );

        if (this.byType.has(internalType)) {
            return this.byType.get(internalType) as Set<Interfaces.ITransaction>;
        }

        return new Set<Interfaces.ITransaction>();
    }

    public getBySender(senderPublicKey: string): Set<Interfaces.ITransaction> {
        if (this.bySender[senderPublicKey] !== undefined) {
            return this.bySender[senderPublicKey];
        }

        return new Set();
    }

    public remember(transaction: Interfaces.ITransaction, databaseReady?: boolean): void {
        const id: string = AppUtils.assert.defined(transaction.id);

        assert.strictEqual(this.byId[id], undefined);

        this.all.push(transaction);
        this.allIsSorted = false;

        this.byId[id] = transaction;

        const sender: string = AppUtils.assert.defined(transaction.data.senderPublicKey);

        const { type, typeGroup } = transaction;

        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Set.
            this.bySender[sender] = new Set([transaction]);
        } else {
            // Append to existing transaction ids for this sender.
            this.bySender[sender].add(transaction);
        }

        const internalType: Transactions.InternalTransactionType = AppUtils.assert.defined(
            Transactions.InternalTransactionType.from(type, typeGroup),
        );

        if (this.byType.has(internalType)) {
            // Append to existing transaction ids for this type.
            AppUtils.assert.defined<Set<Interfaces.ITransaction>>(this.byType.get(internalType)).add(transaction);
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
        const expiration: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
            transaction.data,
            expirationContext,
        );
        if (expiration !== undefined) {
            this.byExpiration.push(transaction);
            this.byExpirationIsSorted = false;
        }

        if (!databaseReady) {
            if (this.dirty.removed.has(id)) {
                // If the transaction has been already in the pool and has been removed
                // and the removal has not propagated to disk yet, just wipe it from the
                // list of removed transactions, so that the old copy stays on disk.
                this.dirty.removed.delete(id);
            } else {
                this.dirty.added.add(id);
            }
        }
    }

    public forget(id: string, senderPublicKey?: string): void {
        if (this.byId[id] === undefined) {
            return;
        }

        if (senderPublicKey === undefined) {
            senderPublicKey = AppUtils.assert.defined(this.byId[id].data.senderPublicKey);
        }

        const transaction: Interfaces.ITransaction = this.byId[id];
        const { type, typeGroup } = this.byId[id];

        // XXX worst case: O(n)
        let i: number = this.byExpiration.findIndex(e => e.id === id);
        if (i !== -1) {
            this.byExpiration.splice(i, 1);
        }

        this.bySender[senderPublicKey!].delete(transaction);
        if (this.bySender[senderPublicKey!].size === 0) {
            delete this.bySender[senderPublicKey!];
        }

        const internalType: Transactions.InternalTransactionType = AppUtils.assert.defined(
            Transactions.InternalTransactionType.from(type, typeGroup),
        );

        const transactions: Set<Interfaces.ITransaction> = AppUtils.assert.defined(this.byType.get(internalType));

        transactions.delete(transaction);

        if (transactions.size === 0) {
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
    private sortAll(): void {
        const currentHeight: number = this.currentHeight();
        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: this.maxTransactionAge,
        };

        this.all.sort((a, b) => {
            const feeA: Utils.BigNumber = a.data.fee;
            const feeB: Utils.BigNumber = b.data.fee;

            if (feeA.isGreaterThan(feeB)) {
                return -1;
            }

            if (feeA.isLessThan(feeB)) {
                return 1;
            }

            const expirationA: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
                a.data,
                expirationContext,
            );
            const expirationB: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
                b.data,
                expirationContext,
            );

            if (expirationA !== undefined && expirationB !== undefined) {
                return expirationA - expirationB;
            }

            return 0;
        });

        const indexBySender = {};
        for (let i = 0; i < this.all.length; i++) {
            const transaction: Interfaces.ITransaction = this.all[i];

            if (transaction.data.version && transaction.data.version < 2) {
                continue;
            }

            const sender: string = AppUtils.assert.defined(transaction.data.senderPublicKey);

            if (indexBySender[sender] === undefined) {
                indexBySender[sender] = [];
            }
            indexBySender[sender].push(i);

            let nMoved = 0;

            for (let j = 0; j < indexBySender[sender].length - 1; j++) {
                const prevIndex: number = indexBySender[sender][j];

                const currNonce: AppUtils.BigNumber = AppUtils.assert.defined(this.all[i].data.nonce);
                const prevNonce: AppUtils.BigNumber = AppUtils.assert.defined(this.all[prevIndex].data.nonce);

                if (currNonce.isLessThan(prevNonce)) {
                    const newIndex = i + 1 + nMoved;
                    this.all.splice(newIndex, 0, this.all[prevIndex]);
                    // @ts-ignore - we can't assign undefined to this array, check for an alternative
                    this.all[prevIndex] = undefined;

                    indexBySender[sender][j] = newIndex;

                    nMoved++;
                }
            }

            if (nMoved > 0) {
                indexBySender[sender].sort((a, b) => a - b);
            }

            i += nMoved;
        }

        this.all = this.all.filter(t => t !== undefined);
    }

    private currentHeight(): number {
        return app.get<any>(Container.Identifiers.StateStore).getLastHeight();
    }
}
