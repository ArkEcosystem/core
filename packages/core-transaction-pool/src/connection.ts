import { strictEqual } from "assert";
import clonedeep from "lodash.clonedeep";

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
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

        let transactionsFromDisk: Interfaces.ITransaction[] = this.storage.loadAll();
        for (const transaction of transactionsFromDisk) {
            this.memory.remember(transaction, true);
        }

        this.emitter.once("internal.stateBuilder.finished", async () => {
            const validTransactions = await this.validateTransactions(transactionsFromDisk);
            transactionsFromDisk = transactionsFromDisk.filter(transaction =>
                validTransactions.includes(transaction.serialized.toString("hex")),
            );

            await this.purgeExpired();
            this.syncToPersistentStorage();
        });

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

    public async getTransactionsByType(type: number): Promise<Set<Interfaces.ITransaction>> {
        await this.purgeExpired();

        return this.memory.getByType(type);
    }

    public async getPoolSize(): Promise<number> {
        await this.purgeExpired();

        return this.memory.count();
    }

    public async getSenderSize(senderPublicKey: string): Promise<number> {
        await this.purgeExpired();

        return this.memory.getBySender(senderPublicKey).size;
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
        return (await this.getValidatedTransactions(0, blockSize, this.options.maxTransactionBytes)).map(transaction =>
            transaction.serialized.toString("hex"),
        );
    }

    public async getTransactionIdsForForging(start: number, size: number): Promise<string[]> {
        return (await this.getValidatedTransactions(start, size, this.options.maxTransactionBytes)).map(
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

        return this.memory.getBySender(senderPublicKey).size >= this.options.maxTransactionsPerSender;
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
            const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(
                transaction.type,
                transaction.typeGroup,
            );

            const senderWallet: State.IWallet = this.walletManager.hasByPublicKey(senderPublicKey)
                ? this.walletManager.findByPublicKey(senderPublicKey)
                : undefined;

            const recipientWallet: State.IWallet = this.walletManager.hasByAddress(data.recipientId)
                ? this.walletManager.findByAddress(data.recipientId)
                : undefined;

            if (recipientWallet) {
                await transactionHandler.applyToRecipient(transaction, this.walletManager);
            }

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
                        `Cannot apply transaction ${transaction.id} when trying to accept ` +
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
            .removeCachedTransactionIds(block.transactions.map(tx => tx.id));
    }

    public async buildWallets(): Promise<void> {
        this.walletManager.reset();

        const transactionIds: string[] = await this.getTransactionIdsForForging(0, await this.getPoolSize());

        app.resolvePlugin<State.IStateService>("state")
            .getStore()
            .removeCachedTransactionIds(transactionIds);

        for (const transactionId of transactionIds) {
            const transaction: Interfaces.ITransaction = await this.getTransaction(transactionId);

            if (!transaction) {
                return;
            }

            const senderWallet: State.IWallet = this.walletManager.findByPublicKey(transaction.data.senderPublicKey);

            // TODO: rework error handling
            try {
                const transactionHandler: Handlers.TransactionHandler = Handlers.Registry.get(
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
        transactionType: Enums.TransactionType,
    ): Promise<boolean> {
        await this.purgeExpired();

        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            if (transaction.type === transactionType) {
                return true;
            }
        }

        return false;
    }

    private async getValidatedTransactions(
        start: number,
        size: number,
        maxBytes: number = 0,
    ): Promise<Interfaces.ITransaction[]> {
        await this.purgeExpired();

        let data: Interfaces.ITransaction[] = [];

        let transactionBytes: number = 0;

        const removeInvalid = async (transactions: Interfaces.ITransaction[]): Promise<Interfaces.ITransaction[]> => {
            const valid = await this.validateTransactions(transactions);
            return transactions.filter(transaction => valid.includes(transaction.serialized.toString("hex")));
        };

        let i = 0;
        const allTransactions: Interfaces.ITransaction[] = [...this.memory.allSortedByFee()];
        for (const transaction of allTransactions) {
            if (data.length === size) {
                data = await removeInvalid(data);
                if (data.length === size) {
                    return data;
                } else {
                    transactionBytes = 0; // TODO: get rid of `maxBytes`
                }
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

        return removeInvalid(data);
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
            const all: Interfaces.ITransaction[] = this.memory.allSortedByFee();
            const lowest: Interfaces.ITransaction = all[all.length - 1];

            const fee: Utils.BigNumber = transaction.data.fee;
            const lowestFee: Utils.BigNumber = lowest.data.fee;

            if (lowestFee.isLessThan(fee)) {
                await this.walletManager.revertTransactionForSender(lowest);
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
            await this.walletManager.throwIfCannotBeApplied(transaction);
            await Handlers.Registry.get(transaction.type, transaction.typeGroup).applyToSender(
                transaction,
                this.walletManager,
            );
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

    private async validateTransactions(transactions: Interfaces.ITransaction[]): Promise<string[]> {
        const validTransactions: string[] = [];
        const forgedIds: string[] = await this.removeForgedTransactions(transactions);

        const unforgedTransactions = transactions.filter(
            (transaction: Interfaces.ITransaction) => !forgedIds.includes(transaction.id),
        );

        const databaseWalletManager: State.IWalletManager = this.databaseService.walletManager;
        const localWalletManager: Wallets.WalletManager = new Wallets.WalletManager();

        for (const transaction of unforgedTransactions) {
            try {
                const deserialized: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytes(
                    transaction.serialized,
                );

                strictEqual(transaction.id, deserialized.id);

                const { sender, recipient } = this.getSenderAndRecipient(transaction, localWalletManager);

                const handler: Handlers.TransactionHandler = Handlers.Registry.get(
                    transaction.type,
                    transaction.typeGroup,
                );
                await handler.throwIfCannotBeApplied(transaction, sender, databaseWalletManager);

                await handler.applyToSender(transaction, localWalletManager);

                if (recipient && sender.address !== recipient.address) {
                    await handler.applyToRecipient(transaction, localWalletManager);
                }

                validTransactions.push(deserialized.serialized.toString("hex"));
            } catch (error) {
                this.removeTransactionById(transaction.id);
                this.logger.error(
                    `Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`,
                );
            }
        }

        return validTransactions;
    }

    private getSenderAndRecipient(
        transaction: Interfaces.ITransaction,
        localWalletManager: State.IWalletManager,
    ): { sender: State.IWallet; recipient: State.IWallet } {
        const databaseWalletManager: State.IWalletManager = this.databaseService.walletManager;
        const { senderPublicKey, recipientId } = transaction.data;

        let sender: State.IWallet;
        let recipient: State.IWallet;

        if (localWalletManager.hasByPublicKey(senderPublicKey)) {
            sender = localWalletManager.findByPublicKey(senderPublicKey);
        } else {
            sender = clonedeep(databaseWalletManager.findByPublicKey(senderPublicKey));
            localWalletManager.reindex(sender);
        }

        // HACK: need tx agonistic way for wallets which are modified by transaction
        if (transaction.type === Enums.TransactionType.Vote) {
            const vote = transaction.data.asset.votes[0].slice(1);
            if (!localWalletManager.hasByPublicKey(vote)) {
                localWalletManager.reindex(clonedeep(databaseWalletManager.findByPublicKey(vote)));
            }
        } else if (transaction.type === Enums.TransactionType.HtlcClaim) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            if (!localWalletManager.hasByIndex(State.WalletIndexes.Locks, lockId)) {
                localWalletManager.reindex(
                    clonedeep(databaseWalletManager.findByIndex(State.WalletIndexes.Locks, lockId)),
                );
            }
        }

        if (recipientId) {
            if (localWalletManager.hasByAddress(recipientId)) {
                recipient = localWalletManager.findByAddress(recipientId);
            } else {
                recipient = clonedeep(databaseWalletManager.findByAddress(recipientId));
                localWalletManager.reindex(recipient);
            }
        }

        return { sender, recipient };
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
                await purge(transaction);

                if (transaction.data.nonce.isEqualTo(lowestNonceBySender[transaction.data.senderPublicKey])) {
                    break;
                }
            }
        }
    }
}
