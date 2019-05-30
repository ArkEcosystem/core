import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
import dayjs, { Dayjs } from "dayjs";
import { ITransactionsProcessed } from "./interfaces";
import { Memory } from "./memory";
import { Processor } from "./processor";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export class Connection implements TransactionPool.IConnection {
    // @TODO: make this private, requires some bigger changes to tests
    public options: Record<string, any>;
    // @TODO: make this private, requires some bigger changes to tests
    public walletManager: WalletManager;
    private readonly memory: Memory;
    private readonly storage: Storage;
    private readonly loggedAllowedSenders: string[] = [];
    private readonly blockedByPublicKey: { [key: string]: Dayjs } = {};
    private readonly databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>(
        "database",
    );
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    constructor({
        options,
        walletManager,
        memory,
        storage,
    }: {
        options: Record<string, any>;
        walletManager: WalletManager;
        memory: Memory;
        storage: Storage;
    }) {
        this.options = options;
        this.walletManager = walletManager;
        this.memory = memory;
        this.storage = storage;
    }

    public async make(): Promise<this> {
        this.memory.flush();
        this.storage.connect(this.options.storage);

        const all: Interfaces.ITransaction[] = this.storage.loadAll();

        for (const transaction of all) {
            this.memory.remember(transaction, true);
        }

        this.purgeExpired();

        const forgedIds: string[] = await this.databaseService.getForgedTransactionsIds(all.map(t => t.id));

        this.removeTransactionsById(forgedIds);

        this.purgeInvalidTransactions();

        this.emitter.on("internal.milestone.changed", () => this.purgeInvalidTransactions());

        return this;
    }

    public disconnect(): void {
        this.syncToPersistentStorage();
        this.storage.disconnect();
    }

    public makeProcessor(): TransactionPool.IProcessor {
        return new Processor(this, this.walletManager);
    }

    public getTransactionsByType(type: number): Set<Interfaces.ITransaction> {
        this.purgeExpired();

        return this.memory.getByType(type);
    }

    public getPoolSize(): number {
        this.purgeExpired();

        return this.memory.count();
    }

    public getSenderSize(senderPublicKey: string): number {
        this.purgeExpired();

        return this.memory.getBySender(senderPublicKey).size;
    }

    public addTransactions(transactions: Interfaces.ITransaction[]): ITransactionsProcessed {
        const added: Interfaces.ITransaction[] = [];
        const notAdded: TransactionPool.IAddTransactionResponse[] = [];

        for (const transaction of transactions) {
            const result: TransactionPool.IAddTransactionResponse = this.addTransaction(transaction);

            result.message ? notAdded.push(result) : added.push(transaction);
        }

        if (added.length > 0) {
            this.emitter.emit(ApplicationEvents.TransactionPoolAdded, added);
        }

        if (notAdded.length > 0) {
            this.emitter.emit(ApplicationEvents.TransactionPoolRejected, notAdded);
        }

        return { added, notAdded };
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        this.memory.forget(id, senderPublicKey);

        this.syncToPersistentStorageIfNecessary();

        this.emitter.emit(ApplicationEvents.TransactionPoolRemoved, id);
    }

    public removeTransactionsById(ids: string[]): void {
        for (const id of ids) {
            this.removeTransactionById(id);
        }
    }

    public getTransaction(id: string): Interfaces.ITransaction {
        this.purgeExpired();

        return this.memory.getById(id);
    }

    public getTransactions(start: number, size: number, maxBytes?: number): Buffer[] {
        return this.getTransactionsData(start, size, maxBytes).map(
            (transaction: Interfaces.ITransaction) => transaction.serialized,
        );
    }

    public getTransactionsForForging(blockSize: number): string[] {
        const transactionMemory: Interfaces.ITransaction[] = this.getTransactionsData(
            0,
            blockSize,
            this.options.maxTransactionBytes,
        );

        const transactions: string[] = [];

        for (const transaction of transactionMemory) {
            try {
                const deserialized: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytes(
                    transaction.serialized,
                );

                strictEqual(transaction.id, deserialized.id);

                const walletManager: State.IWalletManager = this.databaseService.walletManager;
                const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
                Handlers.Registry.get(transaction.type).throwIfCannotBeApplied(transaction, sender, walletManager);

                transactions.push(deserialized.serialized.toString("hex"));
            } catch (error) {
                this.removeTransactionById(transaction.id);

                this.logger.error(`Removed ${transaction.id} before forging because it is no longer valid.`);
            }
        }

        return transactions;
    }

    public getTransactionIdsForForging(start: number, size: number): string[] {
        return this.getTransactionsData(start, size, this.options.maxTransactionBytes).map(
            (transaction: Interfaces.ITransaction) => transaction.id,
        );
    }

    public getTransactionsData(start: number, size: number, maxBytes: number = 0): Interfaces.ITransaction[] {
        this.purgeExpired();

        const data: Interfaces.ITransaction[] = [];

        let transactionBytes: number = 0;

        let i = 0;
        for (const transaction of this.memory.allSortedByFee()) {
            if (i >= start + size) {
                break;
            }

            if (i >= start) {
                let pushTransaction: boolean = false;

                if (maxBytes > 0) {
                    const transactionSize: number = JSON.stringify(transaction.data).length;

                    if (transactionBytes + transactionSize <= maxBytes) {
                        transactionBytes += transactionSize;
                        pushTransaction = true;
                    }
                } else {
                    pushTransaction = true;
                }

                if (pushTransaction) {
                    data.push(transaction);
                    i++;
                }
            } else {
                i++;
            }
        }

        return data;
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            this.removeTransactionById(transaction.id);
        }
    }

    // @TODO: move this to a more appropriate place
    public hasExceededMaxTransactions(senderPublicKey: string): boolean {
        this.purgeExpired();

        if (this.options.allowedSenders.includes(senderPublicKey)) {
            if (!this.loggedAllowedSenders.includes(senderPublicKey)) {
                this.logger.debug(
                    `Transaction pool: allowing sender public key ${senderPublicKey} ` +
                    `(listed in options.allowedSenders), thus skipping throttling.`,
                );

                this.loggedAllowedSenders.push(senderPublicKey);
            }

            return false;
        }

        return this.memory.getBySender(senderPublicKey).size >= this.options.maxTransactionsPerSender;
    }

    public flush(): void {
        this.memory.flush();

        this.storage.deleteAll();
    }

    public has(transactionId: string): boolean {
        if (!this.memory.has(transactionId)) {
            return false;
        }

        this.purgeExpired();

        return this.memory.has(transactionId);
    }

    // @TODO: move this to a more appropriate place
    public isSenderBlocked(senderPublicKey: string): boolean {
        if (!this.blockedByPublicKey[senderPublicKey]) {
            return false;
        }

        if (dayjs().isAfter(this.blockedByPublicKey[senderPublicKey])) {
            delete this.blockedByPublicKey[senderPublicKey];

            return false;
        }

        return true;
    }

    public blockSender(senderPublicKey: string): Dayjs {
        const blockReleaseTime: Dayjs = dayjs().add(1, "hour");

        this.blockedByPublicKey[senderPublicKey] = blockReleaseTime;

        this.logger.warn(
            `Sender ${senderPublicKey} blocked until ${this.blockedByPublicKey[senderPublicKey].toString()}`,
        );

        return blockReleaseTime;
    }

    public acceptChainedBlock(block: Interfaces.IBlock): void {
        for (const transaction of block.transactions) {
            const { data }: Interfaces.ITransaction = transaction;
            const exists: boolean = this.has(data.id);
            const senderPublicKey: string = data.senderPublicKey;
            const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);

            const senderWallet: State.IWallet = this.walletManager.has(senderPublicKey)
                ? this.walletManager.findByPublicKey(senderPublicKey)
                : undefined;

            const recipientWallet: State.IWallet = this.walletManager.has(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : undefined;

            if (recipientWallet) {
                transactionHandler.applyToRecipient(transaction, this.walletManager);
            }

            if (exists) {
                this.removeTransaction(transaction);
            } else if (senderWallet) {
                try {
                    transactionHandler.throwIfCannotBeApplied(transaction, senderWallet, this.databaseService.walletManager);
                    transactionHandler.applyToSender(transaction, this.walletManager);
                } catch (error) {
                    this.purgeByPublicKey(data.senderPublicKey);
                    this.blockSender(data.senderPublicKey);

                    this.logger.error(
                        `Cannot apply transaction ${transaction.id} when trying to accept ` +
                        `block ${block.data.id}: ${error.message}`
                    );

                    return;
                }
            }

            if (
                senderWallet &&
                this.walletManager.canBePurged(senderWallet) &&
                this.getSenderSize(senderPublicKey) === 0
            ) {
                this.walletManager.forget(senderPublicKey);
            }
        }

        // if delegate in poll wallet manager - apply rewards and fees
        if (this.walletManager.has(block.data.generatorPublicKey)) {
            const delegateWallet: State.IWallet = this.walletManager.findByPublicKey(block.data.generatorPublicKey);

            delegateWallet.balance = delegateWallet.balance.plus(block.data.reward.plus(block.data.totalFee));
        }

        app.resolvePlugin<State.IStateService>("state")
            .getStore()
            .removeCachedTransactionIds(block.transactions.map(tx => tx.id));
    }

    public async buildWallets(): Promise<void> {
        this.walletManager.reset();

        const transactionIds: string[] = await this.getTransactionIdsForForging(0, this.getPoolSize());

        app.resolvePlugin<State.IStateService>("state")
            .getStore()
            .removeCachedTransactionIds(transactionIds);

        for (const transactionId of transactionIds) {
            const transaction: Interfaces.ITransaction = this.getTransaction(transactionId);

            if (!transaction) {
                return;
            }

            const senderWallet: State.IWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

            // TODO: rework error handling
            try {
                const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(transaction.type);
                transactionHandler.throwIfCannotBeApplied(transaction, senderWallet, this.databaseService.walletManager);
                transactionHandler.applyToSender(transaction, this.walletManager);
            } catch (error) {
                this.logger.error(`BuildWallets from pool: ${error.message}`);

                this.purgeByPublicKey(transaction.data.senderPublicKey);
            }
        }

        this.logger.info("Transaction Pool Manager build wallets complete");
    }

    public purgeByBlock(block: Interfaces.IBlock): void {
        // Revert in reverse order so that we don't violate nonce rules.
        for (let i = block.transactions.length - 1; i >= 0; i--) {
            const transaction = block.transactions[i];
            if (this.has(transaction.id)) {
                this.removeTransaction(transaction);

                this.walletManager.revertTransactionForSender(transaction);
            }
        }
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        this.logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`);

        this.removeTransactionsForSender(senderPublicKey);

        this.walletManager.forget(senderPublicKey);
    }

    public purgeSendersWithInvalidTransactions(block: Interfaces.IBlock): void {
        const publicKeys: Set<string> = new Set(
            block.transactions
                .filter(transaction => !transaction.verified)
                .map(transaction => transaction.data.senderPublicKey),
        );

        for (const publicKey of publicKeys) {
            this.purgeByPublicKey(publicKey);
        }
    }

    public purgeInvalidTransactions(): void {
        this.purgeTransactions(ApplicationEvents.TransactionPoolRemoved, this.memory.getInvalid());
    }

    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionTypes): boolean {
        this.purgeExpired();

        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            if (transaction.type === transactionType) {
                return true;
            }
        }

        return false;
    }

    private addTransaction(transaction: Interfaces.ITransaction): TransactionPool.IAddTransactionResponse {
        if (this.has(transaction.id)) {
            this.logger.debug(
                "Transaction pool: ignoring attempt to add a transaction that is already " +
                `in the pool, id: ${transaction.id}`,
            );

            return { transaction, type: "ERR_ALREADY_IN_POOL", message: "Already in pool" };
        }

        const poolSize: number = this.memory.count();

        if (this.options.maxTransactionsInPool <= poolSize) {
            // The pool can't accommodate more transactions. Either decline the newcomer or remove
            // an existing transaction from the pool in order to free up space.
            const all: Interfaces.ITransaction[] = this.memory.allSortedByFee();
            const lowest: Interfaces.ITransaction = all[all.length - 1];

            const fee: Utils.BigNumber = transaction.data.fee;
            const lowestFee: Utils.BigNumber = lowest.data.fee;

            if (lowestFee.isLessThan(fee)) {
                this.walletManager.revertTransactionForSender(lowest);
                this.memory.forget(lowest.id, lowest.data.senderPublicKey);
            } else {
                return {
                    transaction,
                    type: "ERR_POOL_FULL",
                    message:
                        `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
                        `${fee.toFixed()} is not higher than the lowest fee already in pool ` +
                        `${lowestFee.toFixed()}`,
                };
            }
        }

        this.memory.remember(transaction);

        try {
            this.walletManager.throwIfCannotBeApplied(transaction);
            Handlers.Registry.get(transaction.type).applyToSender(transaction, this.walletManager);
        } catch (error) {
            this.logger.error(error.message);

            this.memory.forget(transaction.id);

            return { transaction, type: "ERR_APPLY", message: error.message };
        }

        this.syncToPersistentStorageIfNecessary();

        return {};
    }

    private syncToPersistentStorageIfNecessary(): void {
        if (this.options.syncInterval <= this.memory.countDirty()) {
            this.syncToPersistentStorage();
        }
    }

    private syncToPersistentStorage(): void {
        this.storage.bulkAdd(this.memory.pullDirtyAdded());
        this.storage.bulkRemoveById(this.memory.pullDirtyRemoved());
    }

    private purgeExpired(): void {
        this.purgeTransactions(ApplicationEvents.TransactionExpired, this.memory.getExpired());
    }

    /**
     * Remove all provided transactions plus any transactions from the same senders with higher nonces.
     */
    private purgeTransactions(event: string, transactions: Interfaces.ITransaction[]): void {
        const lowestNonceBySender = {};
        for (const transaction of transactions) {
            const senderPublicKey: string = transaction.data.senderPublicKey
            if (lowestNonceBySender[senderPublicKey] === undefined) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            } else if (lowestNonceBySender[senderPublicKey].isGreaterThan(transaction.data.nonce)) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            }
        }

        // Revert all transactions that have bigger or equal nonces than the ones in
        // lowestNonceBySender in order from bigger nonce to smaller nonce.

        for (const senderPublicKey of Object.keys(lowestNonceBySender)) {
            const allTxFromSender = Array.from(this.memory.getBySender(senderPublicKey));
            allTxFromSender.sort((a, b) => {
                if (a.data.nonce.isGreaterThan(b.data.nonce)) {
                    return -1;
                }

                if (a.data.nonce.isLessThan(b.data.nonce)) {
                    return 1;
                }

                return 0;
            });

            for (const transaction of allTxFromSender) {
                this.emitter.emit(event, transaction.data);

                this.walletManager.revertTransactionForSender(transaction);

                this.memory.forget(transaction.id, transaction.data.senderPublicKey);

                this.syncToPersistentStorageIfNecessary();

                if (transaction.data.nonce.isEqualTo(lowestNonceBySender[transaction.data.senderPublicKey])) {
                    break;
                }
            }
        }
    }
}
