import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionHandler, TransactionHandlerRegistry } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";
import { dato, Dato } from "@faustbrian/dato";
import assert from "assert";
import { ITransactionsProcessed } from "./interfaces";
import { Memory } from "./memory";
import { MemoryTransaction } from "./memory-transaction";
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
    private readonly blockedByPublicKey: { [key: string]: Dato } = {};
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

        const all: MemoryTransaction[] = this.storage.loadAll();

        for (const transaction of all) {
            this.memory.remember(transaction, this.options.maxTransactionAge, true);
        }

        this.purgeExpired();

        const forgedIds: string[] = await this.databaseService.getForgedTransactionsIds(
            all.map((transaction: MemoryTransaction) => transaction.transaction.id),
        );

        for (const id of forgedIds) {
            this.removeTransactionById(id);
        }

        return this;
    }

    public disconnect(): void {
        this.syncToPersistentStorage();
        this.storage.disconnect();
    }

    public makeProcessor(): TransactionPool.IProcessor {
        return new Processor(this, this.walletManager);
    }

    public getTransactionsByType(type: number): Set<MemoryTransaction> {
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
            this.emitter.emit("transaction.pool.added", added);
        }

        if (notAdded.length > 0) {
            this.emitter.emit("transaction.pool.rejected", notAdded);
        }

        return { added, notAdded };
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        this.memory.forget(id, senderPublicKey);

        this.syncToPersistentStorageIfNecessary();

        this.emitter.emit("transaction.pool.removed", id);
    }

    public getTransaction(id: string): Interfaces.ITransaction {
        this.purgeExpired();

        return this.memory.getById(id);
    }

    public getTransactions(start: number, size: number, maxBytes?: number): Buffer[] {
        return this.getTransactionsData<Buffer>(start, size, "serialized", maxBytes);
    }

    public getTransactionsForForging(blockSize: number): string[] {
        return this.getTransactions(0, blockSize, this.options.maxTransactionBytes).map(tx => tx.toString("hex"));
    }

    public getTransactionIdsForForging(start: number, size: number): string[] {
        return this.getTransactionsData<string>(start, size, "id", this.options.maxTransactionBytes);
    }

    public getTransactionsData<T>(start: number, size: number, property: string, maxBytes: number = 0): T[] {
        this.purgeExpired();

        const data: T[] = [];

        let transactionBytes: number = 0;

        let i = 0;
        for (const MemoryTransaction of this.memory.allSortedByFee()) {
            if (i >= start + size) {
                break;
            }

            if (i >= start) {
                let pushTransaction: boolean = false;

                assert.notStrictEqual(MemoryTransaction.transaction[property], undefined);

                if (maxBytes > 0) {
                    const transactionSize: number = JSON.stringify(MemoryTransaction.transaction.data).length;

                    if (transactionBytes + transactionSize <= maxBytes) {
                        transactionBytes += transactionSize;
                        pushTransaction = true;
                    }
                } else {
                    pushTransaction = true;
                }

                if (pushTransaction) {
                    data.push(MemoryTransaction.transaction[property]);
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
            this.removeTransactionById(transaction.transaction.id);
        }
    }

    // @TODO: move this to a more appropriate place
    public hasExceededMaxTransactions(transaction: Interfaces.ITransactionData): boolean {
        this.purgeExpired();

        if (this.options.allowedSenders.includes(transaction.senderPublicKey)) {
            if (!this.loggedAllowedSenders.includes(transaction.senderPublicKey)) {
                this.logger.debug(
                    `Transaction pool: allowing sender public key: ${
                        transaction.senderPublicKey
                    } (listed in options.allowedSenders), thus skipping throttling.`,
                );

                this.loggedAllowedSenders.push(transaction.senderPublicKey);
            }

            return false;
        }

        return this.memory.getBySender(transaction.senderPublicKey).size >= this.options.maxTransactionsPerSender;
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

        if (dato().isAfter(this.blockedByPublicKey[senderPublicKey])) {
            delete this.blockedByPublicKey[senderPublicKey];

            return false;
        }

        return true;
    }

    public blockSender(senderPublicKey: string): Dato {
        const blockReleaseTime: Dato = dato().addHours(1);

        this.blockedByPublicKey[senderPublicKey] = blockReleaseTime;

        this.logger.warn(`Sender ${senderPublicKey} blocked until ${this.blockedByPublicKey[senderPublicKey].toUTC()}`);

        return blockReleaseTime;
    }

    public acceptChainedBlock(block: Interfaces.IBlock): void {
        for (const transaction of block.transactions) {
            const { data }: Interfaces.ITransaction = transaction;
            const exists: boolean = this.has(data.id);
            const senderPublicKey: string = data.senderPublicKey;
            const transactionHandler: ITransactionHandler = TransactionHandlerRegistry.get(transaction.type);

            const senderWallet: Database.IWallet = this.walletManager.has(senderPublicKey)
                ? this.walletManager.findByPublicKey(senderPublicKey)
                : undefined;

            const recipientWallet: Database.IWallet = this.walletManager.has(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : undefined;

            if (recipientWallet) {
                transactionHandler.applyToRecipient(transaction, recipientWallet);
            }

            if (exists) {
                this.removeTransaction(transaction);
            } else if (senderWallet) {
                // TODO: rework error handling
                try {
                    transactionHandler.canBeApplied(transaction, senderWallet);
                } catch (error) {
                    this.purgeByPublicKey(data.senderPublicKey);
                    this.blockSender(data.senderPublicKey);

                    this.logger.error(
                        `CanApply transaction test failed on acceptChainedBlock() in transaction pool for transaction id:${
                            data.id
                        } due to ${error.message}. Possible double spending attack`,
                    );

                    return;
                }

                transactionHandler.applyToSender(transaction, senderWallet);
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
            const delegateWallet: Database.IWallet = this.walletManager.findByPublicKey(block.data.generatorPublicKey);

            delegateWallet.balance = delegateWallet.balance.plus(block.data.reward.plus(block.data.totalFee));
        }

        app.resolvePlugin<State.IStateStorage>("state").removeCachedTransactionIds(block.transactions.map(tx => tx.id));
    }

    public async buildWallets(): Promise<void> {
        this.walletManager.reset();

        const transactionIds: string[] = await this.getTransactionIdsForForging(0, this.getPoolSize());

        app.resolvePlugin<State.IStateStorage>("state").removeCachedTransactionIds(transactionIds);

        for (const transactionId of transactionIds) {
            const transaction: Interfaces.ITransaction = this.getTransaction(transactionId);

            if (!transaction) {
                return;
            }

            const senderWallet: Database.IWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

            // TODO: rework error handling
            try {
                const transactionHandler: ITransactionHandler = TransactionHandlerRegistry.get(transaction.type);
                transactionHandler.canBeApplied(transaction, senderWallet);
                transactionHandler.applyToSender(transaction, senderWallet);
            } catch (error) {
                this.logger.error(`BuildWallets from pool: ${error.message}`);

                this.purgeByPublicKey(transaction.data.senderPublicKey);
            }
        }

        this.logger.info("Transaction Pool Manager build wallets complete");
    }

    public purgeByBlock(block: Interfaces.IBlock): void {
        for (const transaction of block.transactions) {
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

    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionTypes): boolean {
        this.purgeExpired();

        for (const MemoryTransaction of this.memory.getBySender(senderPublicKey)) {
            if (MemoryTransaction.transaction.type === transactionType) {
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
            const all: MemoryTransaction[] = this.memory.allSortedByFee();
            const lowest: Interfaces.ITransaction = all[all.length - 1].transaction;

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

        this.memory.remember(new MemoryTransaction(transaction), this.options.maxTransactionAge);

        // Apply transaction to pool wallet manager.
        const senderWallet: Database.IWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

        try {
            this.walletManager.throwIfApplyingFails(transaction);

            TransactionHandlerRegistry.get(transaction.type).applyToSender(transaction, senderWallet);
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

    private purgeExpired() {
        for (const transaction of this.memory.getExpired(this.options.maxTransactionAge)) {
            this.emitter.emit("transaction.expired", transaction.data);

            this.walletManager.revertTransactionForSender(transaction);

            this.memory.forget(transaction.id, transaction.data.senderPublicKey);

            this.syncToPersistentStorageIfNecessary();
        }
    }
}
