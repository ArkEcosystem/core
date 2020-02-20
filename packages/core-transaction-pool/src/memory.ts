import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";

// todo: review implementation and reduce the complexity of all methods as it is quite high
/**
 * @export
 * @class Memory
 */
@Container.injectable()
export class Memory {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Memory
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Providers.PluginConfiguration}
     * @memberof Memory
     */
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    /**
     * An array of all transactions, possibly sorted by fee (highest fee first).
     * We use lazy sorting:
     * - insertion just appends at the end, complexity: O(1) + flag it as unsorted
     * - deletion removes by using splice(), complexity: O(n) + flag it as unsorted
     * - lookup sorts if it is not sorted, complexity: O(n*log(n) + flag it as sorted
     *
     * @private
     * @type {Interfaces.ITransaction[]}
     * @memberof Memory
     */
    private all: Interfaces.ITransaction[] = [];

    /**
     * @private
     * @memberof Memory
     */
    private allIsSorted = true;

    /**
     * @private
     * @type {{ [key: string]: Interfaces.ITransaction }}
     * @memberof Memory
     */
    private byId: { [key: string]: Interfaces.ITransaction } = {};

    /**
     * @private
     * @type {{ [key: string]: Set<Interfaces.ITransaction> }}
     * @memberof Memory
     */
    private bySender: { [key: string]: Set<Interfaces.ITransaction> } = {};

    /**
     * @private
     * @type {Map<Transactions.InternalTransactionType, Set<Interfaces.ITransaction>>}
     * @memberof Memory
     */
    private byType: Map<Transactions.InternalTransactionType, Set<Interfaces.ITransaction>> = new Map();

    /**
     * Contains only transactions that expire, possibly sorted by height (lower first).
     *
     * @private
     * @type {Interfaces.ITransaction[]}
     * @memberof Memory
     */
    private byExpiration: Interfaces.ITransaction[] = [];

    /**
     * @private
     * @memberof Memory
     */
    private byExpirationIsSorted = true;

    /**
     * @returns {Interfaces.ITransaction[]}
     * @memberof Memory
     */
    public allSortedByFee(): Interfaces.ITransaction[] {
        if (!this.allIsSorted) {
            this.sortAll();
            this.allIsSorted = true;
        }

        return this.all;
    }

    /**
     * @returns {Interfaces.ITransaction[]}
     * @memberof Memory
     */
    public getExpired(): Interfaces.ITransaction[] {
        const currentHeight: number = this.currentHeight();
        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: this.configuration.getRequired<number>("maxTransactionAge"),
        };

        if (!this.byExpirationIsSorted) {
            this.byExpiration.sort((a, b) => {
                const expirationA: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
                    a.data,
                    expirationContext,
                );

                const expirationB: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
                    b.data,
                    expirationContext,
                );

                AppUtils.assert.defined<number>(expirationA);
                AppUtils.assert.defined<number>(expirationB);

                return expirationA - expirationB;
            });

            this.byExpirationIsSorted = true;
        }

        const transactions: Interfaces.ITransaction[] = [];

        for (const transaction of this.byExpiration) {
            const expiration: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
                transaction.data,
                expirationContext,
            );

            AppUtils.assert.defined<number>(expiration);

            if (expiration > currentHeight) {
                break;
            }

            transactions.push(transaction);
        }

        return transactions;
    }

    /**
     * @returns {Interfaces.ITransaction[]}
     * @memberof Memory
     */
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

    public getAll(): Iterable<Interfaces.ITransaction> {
        return this.all;
    }

    /**
     * @param {string} id
     * @returns {(Interfaces.ITransaction | undefined)}
     * @memberof Memory
     */
    public getById(id: string): Interfaces.ITransaction | undefined {
        if (this.byId[id] === undefined) {
            return undefined;
        }

        return this.byId[id];
    }

    /**
     * @param {number} type
     * @param {number} typeGroup
     * @returns {Set<Interfaces.ITransaction>}
     * @memberof Memory
     */
    public getByType(type: number, typeGroup: number): Set<Interfaces.ITransaction> {
        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(type, typeGroup);

        AppUtils.assert.defined<Transactions.InternalTransactionType>(internalType);

        if (this.byType.has(internalType)) {
            return this.byType.get(internalType) as Set<Interfaces.ITransaction>;
        }

        return new Set<Interfaces.ITransaction>();
    }

    /**
     * @param {string} senderPublicKey
     * @returns {Set<Interfaces.ITransaction>}
     * @memberof Memory
     */
    public getBySender(senderPublicKey: string): Set<Interfaces.ITransaction> {
        if (this.bySender[senderPublicKey] !== undefined) {
            return this.bySender[senderPublicKey];
        }

        return new Set();
    }

    /**
     * @param {Interfaces.ITransaction} transaction
     * @memberof Memory
     */
    public remember(transaction: Interfaces.ITransaction): void {
        AppUtils.assert.defined<string>(transaction.id);

        const id: string = transaction.id;

        assert.strictEqual(this.byId[id], undefined);

        this.all.push(transaction);
        this.allIsSorted = false;

        this.byId[id] = transaction;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: string = transaction.data.senderPublicKey;

        const { type, typeGroup } = transaction;

        if (this.bySender[sender] === undefined) {
            // First transaction from this sender, create a new Set.
            this.bySender[sender] = new Set([transaction]);
        } else {
            // Append to existing transaction ids for this sender.
            this.bySender[sender].add(transaction);
        }

        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(type, typeGroup);

        AppUtils.assert.defined<Transactions.InternalTransactionType>(internalType);

        if (this.byType.has(internalType)) {
            // Append to existing transaction ids for this type.
            const transactions: Set<Interfaces.ITransaction> | undefined = this.byType.get(internalType);

            AppUtils.assert.defined<Set<Interfaces.ITransaction>>(transactions);

            transactions.add(transaction);
        } else {
            // First transaction of this type, create a new Set.
            this.byType.set(internalType, new Set([transaction]));
        }

        const currentHeight: number = this.currentHeight();
        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: this.configuration.getRequired<number>("maxTransactionAge"),
        };
        const expiration: number | undefined = AppUtils.expirationCalculator.calculateTransactionExpiration(
            transaction.data,
            expirationContext,
        );
        if (expiration !== undefined) {
            this.byExpiration.push(transaction);
            this.byExpirationIsSorted = false;
        }
    }

    /**
     * @param {string} id
     * @param {string} [senderPublicKey]
     * @returns {void}
     * @memberof Memory
     */
    public forget(id: string, senderPublicKey?: string): void {
        if (this.byId[id] === undefined) {
            return;
        }

        if (senderPublicKey === undefined) {
            AppUtils.assert.defined<string>(this.byId[id].data.senderPublicKey);

            senderPublicKey = this.byId[id].data.senderPublicKey;
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

        const internalType:
            | Transactions.InternalTransactionType
            | undefined = Transactions.InternalTransactionType.from(type, typeGroup);

        AppUtils.assert.defined<Transactions.InternalTransactionType>(internalType);

        const transactions: Set<Interfaces.ITransaction> | undefined = this.byType.get(internalType);

        AppUtils.assert.defined<Set<Interfaces.ITransaction>>(transactions);

        transactions.delete(transaction);

        if (transactions.size === 0) {
            this.byType.delete(internalType);
        }

        delete this.byId[id];

        i = this.all.findIndex(e => e.id === id);
        assert.notStrictEqual(i, -1);
        this.all.splice(i, 1);
        this.allIsSorted = false;
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
    }

    public count(): number {
        return this.all.length;
    }

    /**
     * Sort `this.all` by fee (highest fee first) with the exception that transactions
     * from the same sender must be ordered lowest `nonce` first.
     *
     * @private
     * @memberof Memory
     */
    private sortAll(): void {
        const currentHeight: number = this.currentHeight();
        const expirationContext = {
            blockTime: Managers.configManager.getMilestone(currentHeight).blocktime,
            currentHeight,
            now: Crypto.Slots.getTime(),
            maxTransactionAge: this.configuration.getRequired<number>("maxTransactionAge"),
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

            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            const sender: string = transaction.data.senderPublicKey;

            if (indexBySender[sender] === undefined) {
                indexBySender[sender] = [];
            }
            indexBySender[sender].push(i);

            let nMoved = 0;

            for (let j = 0; j < indexBySender[sender].length - 1; j++) {
                const prevIndex: number = indexBySender[sender][j];

                const currNonce: AppUtils.BigNumber | undefined = this.all[i].data.nonce;
                const prevNonce: AppUtils.BigNumber | undefined = this.all[prevIndex].data.nonce;

                AppUtils.assert.defined<AppUtils.BigNumber>(currNonce);
                AppUtils.assert.defined<AppUtils.BigNumber>(prevNonce);

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

    /**
     * @private
     * @returns {number}
     * @memberof Memory
     */
    private currentHeight(): number {
        return this.app.get<any>(Container.Identifiers.StateStore).getLastHeight();
    }
}
