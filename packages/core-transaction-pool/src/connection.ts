import { strictEqual } from "assert";

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Transactions } from "@arkecosystem/crypto";
import differencewith from "lodash.differencewith";
import { ITransactionsProcessed } from "./interfaces";
import { Memory } from "./memory";
import { Processor } from "./processor";
import { Storage } from "./storage";
import { getMaxTransactionBytes } from "./utils";
import { WalletManager } from "./wallet-manager";

export class Connection implements TransactionPool.IConnection {
    // @TODO: make this private, requires some bigger changes to tests
    public options: Record<string, any>;
    // @TODO: make this private, requires some bigger changes to tests
    public walletManager: WalletManager;
    private readonly memory: Memory;
    private readonly storage: Storage;
    private readonly loggedAllowedSenders: string[] = [];
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

        const transactionsFromDisk: Interfaces.ITransaction[] = this.storage.loadAll();
        for (const transaction of transactionsFromDisk) {
            this.memory.remember(transaction, true);
        }

        this.emitter.once(ApplicationEvents.StateBuilderFinished, async () => {
            // Remove from the pool invalid entries found in `transactionsFromDisk`.
            await this.validateTransactions(transactionsFromDisk);
            await this.purgeExpired();
            this.syncToPersistentStorage();
        });

        this.emitter.on(ApplicationEvents.InternalMilestoneChanged, () => this.purgeInvalidTransactions());

        return this;
    }

    public disconnect(): void {
        this.syncToPersistentStorage();
        this.storage.disconnect();
    }

    public makeProcessor(): TransactionPool.IProcessor {
        return new Processor(this);
    }

    public getAllTransactions(): Interfaces.ITransaction[] {
        return this.memory.sortedByFee();
    }

    public async getTransactionsByType(type: number, typeGroup?: number): Promise<Set<Interfaces.ITransaction>> {
        if (typeGroup === undefined) {
            typeGroup = Enums.TransactionTypeGroup.Core;
        }

        await this.purgeExpired();

        return this.memory.getByType(type, typeGroup);
    }

    public async getPoolSize(): Promise<number> {
        await this.purgeExpired();

        return this.memory.count();
    }

    public async getSenderSize(senderPublicKey: string): Promise<number> {
        await this.purgeExpired();

        return this.memory.getBySender(senderPublicKey).length;
    }

    public async addTransactions(transactions: Interfaces.ITransaction[]): Promise<ITransactionsProcessed> {
        const added: Interfaces.ITransaction[] = [];
        const notAdded: TransactionPool.IAddTransactionResponse[] = [];

        for (const transaction of transactions) {
            const result: TransactionPool.IAddTransactionResponse = await this.addTransaction(transaction);

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

    public async getTransaction(id: string): Promise<Interfaces.ITransaction> {
        await this.purgeExpired();

        return this.memory.getById(id);
    }

    public async getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]> {
        return (await this.getValidatedTransactions(start, size, maxBytes)).map(
            (transaction: Interfaces.ITransaction) => transaction.serialized,
        );
    }

    public async getTransactionsForForging(blockSize: number): Promise<string[]> {
        return (await this.getValidatedTransactions(0, blockSize, getMaxTransactionBytes())).map(transaction =>
            transaction.serialized.toString("hex"),
        );
    }

    public async getTransactionIdsForForging(start: number, size: number): Promise<string[]> {
        return (await this.getValidatedTransactions(start, size, getMaxTransactionBytes())).map(
            (transaction: Interfaces.ITransaction) => transaction.id,
        );
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            this.removeTransactionById(transaction.id);
        }
    }

    // @TODO: move this to a more appropriate place
    public async hasExceededMaxTransactions(senderPublicKey: string): Promise<boolean> {
        await this.purgeExpired();

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

        return this.memory.getBySender(senderPublicKey).length >= this.options.maxTransactionsPerSender;
    }

    public flush(): void {
        this.memory.flush();

        this.storage.deleteAll();
    }

    public async has(transactionId: string): Promise<boolean> {
        if (!this.memory.has(transactionId)) {
            return false;
        }

        await this.purgeExpired();

        return this.memory.has(transactionId);
    }

    public async acceptChainedBlock(block: Interfaces.IBlock): Promise<void> {
        for (const transaction of block.transactions) {
            const { data }: Interfaces.ITransaction = transaction;
            const exists: boolean = await this.has(data.id);
            const senderPublicKey: string = data.senderPublicKey;
            const transactionHandler: Handlers.TransactionHandler = await Handlers.Registry.get(
                transaction.type,
                transaction.typeGroup,
            );

            await transactionHandler.applyToRecipient(transaction, this.walletManager);

            const senderWallet: State.IWallet = this.walletManager.findByPublicKey(senderPublicKey);

            const recipientWallet: State.IWallet = this.walletManager.hasByAddress(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : undefined;

            if (exists) {
                this.removeTransaction(transaction);
            } else if (senderWallet) {
                try {
                    await transactionHandler.throwIfCannotBeApplied(
                        transaction,
                        senderWallet,
                        this.databaseService.walletManager,
                    );
                    await transactionHandler.applyToSender(transaction, this.walletManager);
                } catch (error) {
                    this.walletManager.forget(data.senderPublicKey);

                    if (recipientWallet) {
                        recipientWallet.publicKey
                            ? this.walletManager.forget(recipientWallet.publicKey)
                            : this.walletManager.forgetByAddress(recipientWallet.address);
                    }

                    this.logger.error(
                        `[Pool] Cannot apply transaction ${transaction.id} when trying to accept ` +
                            `block ${block.data.id}: ${error.message}`,
                    );

                    continue;
                }
            }

            if (
                senderWallet &&
                this.walletManager.canBePurged(senderWallet) &&
                (await this.getSenderSize(senderPublicKey)) === 0
            ) {
                this.walletManager.forget(senderPublicKey);
            }
        }

        // if delegate in poll wallet manager - apply rewards and fees
        if (this.walletManager.hasByPublicKey(block.data.generatorPublicKey)) {
            const delegateWallet: State.IWallet = this.walletManager.findByPublicKey(block.data.generatorPublicKey);

            delegateWallet.balance = delegateWallet.balance.plus(block.data.reward.plus(block.data.totalFee));
        }

        app.resolvePlugin<State.IStateService>("state")
            .getStore()
            .clearCachedTransactionIds();
    }

    public async buildWallets(): Promise<void> {
        this.walletManager.reset();

        const transactionIds: string[] = await this.getTransactionIdsForForging(0, await this.getPoolSize());

        app.resolvePlugin<State.IStateService>("state")
            .getStore()
            .clearCachedTransactionIds();

        for (const transactionId of transactionIds) {
            const transaction: Interfaces.ITransaction = await this.getTransaction(transactionId);

            if (!transaction) {
                return;
            }

            const senderWallet: State.IWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

            // TODO: rework error handling
            try {
                const transactionHandler: Handlers.TransactionHandler = await Handlers.Registry.get(
                    transaction.type,
                    transaction.typeGroup,
                );
                await transactionHandler.throwIfCannotBeApplied(
                    transaction,
                    senderWallet,
                    this.databaseService.walletManager,
                );
                await transactionHandler.applyToSender(transaction, this.walletManager);
            } catch (error) {
                this.logger.error(`BuildWallets from pool: ${error.message}`);

                this.purgeByPublicKey(transaction.data.senderPublicKey);
            }
        }

        this.logger.info("Transaction Pool Manager build wallets complete");
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        this.logger.debug(`Purging sender: ${senderPublicKey} from pool wallet manager`);

        this.removeTransactionsForSender(senderPublicKey);

        this.walletManager.forget(senderPublicKey);
    }

    public async purgeInvalidTransactions(): Promise<void> {
        return this.purgeTransactions(ApplicationEvents.TransactionPoolRemoved, this.memory.getInvalid());
    }

    public async senderHasTransactionsOfType(
        senderPublicKey: string,
        type: number,
        typeGroup?: number,
    ): Promise<boolean> {
        await this.purgeExpired();

        if (typeGroup === undefined) {
            typeGroup = Enums.TransactionTypeGroup.Core;
        }

        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            const transactionGroup: number =
                transaction.typeGroup === undefined ? Enums.TransactionTypeGroup.Core : transaction.typeGroup;

            if (transaction.type === type && transactionGroup === typeGroup) {
                return true;
            }
        }

        return false;
    }

    public async replay(transactions: Interfaces.ITransaction[]): Promise<void> {
        this.flush();
        this.walletManager.reset();

        for (const transaction of transactions) {
            try {
                const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
                    transaction.type,
                    transaction.typeGroup,
                );
                await handler.applyToSender(transaction, this.walletManager);
                await handler.applyToRecipient(transaction, this.walletManager);

                this.memory.remember(transaction);
            } catch (error) {
                this.logger.error(`[Pool] Transaction (${transaction.id}): ${error.message}`);
            }
        }
    }

    private async getValidatedTransactions(
        start: number,
        size: number,
        maxBytes: number = 0,
    ): Promise<Interfaces.ITransaction[]> {
        await this.purgeExpired();

        const data: Interfaces.ITransaction[] = [];

        let transactionBytes: number = 0;

        const tempWalletManager: Wallets.TempWalletManager = new Wallets.TempWalletManager(
            this.databaseService.walletManager,
        );

        let i = 0;
        // Copy the returned array because validateTransactions() in the loop body we may remove entries.
        const allTransactions: Interfaces.ITransaction[] = [
            ...this.memory.sortedByFee(start + size), // fetch only what we need
        ];
        for (const transaction of allTransactions) {
            if (data.length === size) {
                return data;
            }

            const valid: Interfaces.ITransaction[] = await this.validateTransactions([transaction], tempWalletManager);

            if (valid.length === 0) {
                continue;
            }

            if (i++ < start) {
                continue;
            }

            if (maxBytes > 0) {
                const transactionSize: number = transaction.serialized.byteLength;

                if (transactionBytes + transactionSize > maxBytes) {
                    return data;
                }

                transactionBytes += transactionSize;
            }

            data.push(transaction);
        }

        return data;
    }

    private async addTransaction(
        transaction: Interfaces.ITransaction,
    ): Promise<TransactionPool.IAddTransactionResponse> {
        if (await this.has(transaction.id)) {
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
            const lowest: Interfaces.ITransaction = this.memory.getLowestFeeLastNonce();

            if (lowest && lowest.data.fee.isLessThan(transaction.data.fee)) {
                await this.walletManager.revertTransactionForSender(lowest);
                this.memory.forget(lowest.data.id, lowest.data.senderPublicKey);
            } else {
                return {
                    transaction,
                    type: "ERR_POOL_FULL",
                    message:
                        `Pool is full (has ${poolSize} transactions) and this transaction's fee ` +
                        `${transaction.data.fee.toFixed()} is not higher than the lowest fee already in pool ` +
                        `${lowest ? lowest.data.fee.toFixed() : ""}`,
                };
            }
        }

        this.memory.remember(transaction);

        try {
            await this.walletManager.throwIfCannotBeApplied(transaction);

            const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
                transaction.type,
                transaction.typeGroup,
            );
            await handler.applyToSender(transaction, this.walletManager);
        } catch (error) {
            this.logger.error(`[Pool] ${error.message}`);

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

    /**
     * Validate the given transactions and return only the valid ones - a subset of the input.
     * The invalid ones are removed from the pool.
     */
    private async validateTransactions(
        transactions: Interfaces.ITransaction[],
        walletManager?: Wallets.TempWalletManager,
    ): Promise<Interfaces.ITransaction[]> {
        const validTransactions: Interfaces.ITransaction[] = [];
        const forgedIds: string[] = await this.removeForgedTransactions(transactions);

        const unforgedTransactions = differencewith(transactions, forgedIds, (t, forgedId) => t.id === forgedId);

        if (walletManager === undefined) {
            walletManager = new Wallets.TempWalletManager(this.databaseService.walletManager);
        }

        for (const transaction of unforgedTransactions) {
            try {
                const deserialized: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytes(
                    transaction.serialized,
                );

                strictEqual(transaction.id, deserialized.id);

                const handler: Handlers.TransactionHandler = await Handlers.Registry.get(
                    transaction.type,
                    transaction.typeGroup,
                );

                await handler.applyToSender(transaction, walletManager);

                await handler.applyToRecipient(transaction, walletManager);

                validTransactions.push(transaction);
            } catch (error) {
                this.removeTransactionById(transaction.id);
                this.logger.error(
                    `[Pool] Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`,
                );
            }
        }

        return validTransactions;
    }

    private async removeForgedTransactions(transactions: Interfaces.ITransaction[]): Promise<string[]> {
        const forgedIds: string[] = await this.databaseService.getForgedTransactionsIds(
            transactions.map(({ id }) => id),
        );

        this.removeTransactionsById(forgedIds);
        return forgedIds;
    }

    private async purgeExpired(): Promise<void> {
        return this.purgeTransactions(ApplicationEvents.TransactionExpired, this.memory.getExpired());
    }

    /**
     * Remove all provided transactions plus any transactions from the same senders with higher nonces.
     */
    private async purgeTransactions(event: string, transactions: Interfaces.ITransaction[]): Promise<void> {
        const purge = async (transaction: Interfaces.ITransaction) => {
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

            const senderPublicKey: string = transaction.data.senderPublicKey;
            if (lowestNonceBySender[senderPublicKey] === undefined) {
                lowestNonceBySender[senderPublicKey] = transaction.data.nonce;
            } else if (lowestNonceBySender[senderPublicKey].isGreaterThan(transaction.data.nonce)) {
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
