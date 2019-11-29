import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Enums as AppEnums, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
import differenceWith from "lodash.differencewith";

import { TransactionsProcessed } from "./interfaces";
import { PurgeInvalidTransactions } from "./listeners";
import { Memory } from "./memory";
import { PoolWalletRepository } from "./pool-wallet-repository";
import { Processor } from "./processor";
import { Storage } from "./storage";

// todo: migrate to make use of ioc
// todo: review the implementation
// todo: reduce the overall complexity of methods
// todo: review if the purging logic should be moved out as there is quite a bit of it now
@Container.injectable()
export class Connection implements Contracts.TransactionPool.Connection {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.WalletRepository)
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: Repositories.TransactionRepository;

    // todo: make private readonly
    @Container.inject(Container.Identifiers.TransactionPoolWalletRepository)
    public poolWalletRepository!: PoolWalletRepository;

    // @todo: make this private, requires some bigger changes to tests
    public options!: Record<string, any>;

    private memory!: Memory;
    private storage!: Storage;
    private loggedAllowedSenders!: string[];

    private emitter!: Contracts.Kernel.EventDispatcher;
    private logger!: Contracts.Kernel.Logger;

    init({ options, memory, storage }: { options: Record<string, any>; memory: Memory; storage: Storage }) {
        this.options = options;
        this.memory = memory;
        this.storage = storage;

        this.loggedAllowedSenders = [];

        this.emitter = this.app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService);
        this.logger = this.app.log;

        return this;
    }

    public async make(): Promise<this> {
        this.memory.flush();
        this.storage.connect(this.options.storage);

        const transactionsFromDisk: Interfaces.ITransaction[] = this.storage.loadAll();
        for (const transaction of transactionsFromDisk) {
            this.memory.remember(transaction, true);
        }

        this.poolWalletRepository.initialize();

        // Remove from the pool invalid entries found in `transactionsFromDisk`.
        if (process.env.CORE_RESET_DATABASE) {
            this.memory.flush();
        } else {
            await this.validateTransactions(transactionsFromDisk);
            await this.purgeExpired();
        }

        this.syncToPersistentStorage();

        this.emitter.listen(AppEnums.CryptoEvent.MilestoneChanged, new PurgeInvalidTransactions(this));

        return this;
    }

    public disconnect(): void {
        this.syncToPersistentStorage();
        this.storage.disconnect();
    }

    public makeProcessor(): Contracts.TransactionPool.Processor {
        return this.app.resolve<Processor>(Processor).init(this);
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

        return this.memory.getBySender(senderPublicKey).size;
    }

    public async addTransactions(transactions: Interfaces.ITransaction[]): Promise<TransactionsProcessed> {
        const added: Interfaces.ITransaction[] = [];
        const notAdded: Contracts.TransactionPool.AddTransactionResponse[] = [];

        for (const transaction of transactions) {
            const result: Contracts.TransactionPool.AddTransactionResponse = await this.addTransaction(transaction);

            result.message ? notAdded.push(result) : added.push(transaction);
        }

        if (added.length > 0) {
            this.emitter.dispatch(AppEnums.TransactionEvent.AddedToPool, added);
        }

        if (notAdded.length > 0) {
            this.emitter.dispatch(AppEnums.TransactionEvent.RejectedByPool, notAdded);
        }

        return { added, notAdded };
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        AppUtils.assert.defined<string>(transaction.id);

        this.removeTransactionById(transaction.id, transaction.data.senderPublicKey);
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        this.memory.forget(id, senderPublicKey);

        this.syncToPersistentStorageIfNecessary();

        this.emitter.dispatch(AppEnums.TransactionEvent.RemovedFromPool, id);
    }

    public removeTransactionsById(ids: string[]): void {
        for (const id of ids) {
            this.removeTransactionById(id);
        }
    }

    public async getTransaction(id: string): Promise<Interfaces.ITransaction | undefined> {
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
        const transactions: Interfaces.ITransaction[] = await this.getValidatedTransactions(
            start,
            size,
            this.options.maxTransactionBytes,
        );

        return transactions.map((transaction: Interfaces.ITransaction) => {
            AppUtils.assert.defined<string>(transaction.id);

            return transaction.id;
        });
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        for (const transaction of this.memory.getBySender(senderPublicKey)) {
            AppUtils.assert.defined<string>(transaction.id);

            this.removeTransactionById(transaction.id);
        }
    }

    // @todo: move this to a more appropriate place
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

            AppUtils.assert.defined<string>(data.id);

            const exists: boolean = await this.has(data.id);

            AppUtils.assert.defined<string>(data.senderPublicKey);

            const senderPublicKey: string = data.senderPublicKey;

            const transactionHandler: Handlers.TransactionHandler = await this.app
                .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
                .get(transaction.data);

            const senderWallet: Contracts.State.Wallet = this.poolWalletRepository.findByPublicKey(senderPublicKey);

            let recipientWallet: Contracts.State.Wallet | undefined;

            if (data.recipientId && this.poolWalletRepository.hasByAddress(data.recipientId)) {
                recipientWallet = this.poolWalletRepository.findByAddress(data.recipientId);
            }

            if (recipientWallet) {
                await transactionHandler.applyToRecipient(transaction, this.poolWalletRepository);
            }

            if (exists) {
                this.removeTransaction(transaction);
            } else if (senderWallet) {
                try {
                    await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet, this.walletRepository);
                    await transactionHandler.applyToSender(transaction, this.poolWalletRepository);
                } catch (error) {
                    this.poolWalletRepository.forget(senderPublicKey);

                    if (recipientWallet) {
                        recipientWallet.publicKey
                            ? this.poolWalletRepository.forget(recipientWallet.publicKey)
                            : this.poolWalletRepository.forgetByAddress(recipientWallet.address);
                    }

                    this.logger.error(
                        `[Pool] Cannot apply transaction ${transaction.id} when trying to accept ` +
                        `block ${block.data.id}: ${error.message}`,
                    );

                    continue;
                }
            }

            if (senderWallet && this.canBePurged(senderWallet) && (await this.getSenderSize(senderPublicKey)) === 0) {
                this.poolWalletRepository.forget(senderPublicKey);
            }
        }

        // if delegate in poll wallet manager - apply rewards and fees
        if (this.poolWalletRepository.hasByPublicKey(block.data.generatorPublicKey)) {
            const delegateWallet: Contracts.State.Wallet = this.poolWalletRepository.findByPublicKey(
                block.data.generatorPublicKey,
            );

            delegateWallet.balance = delegateWallet.balance.plus(block.data.reward.plus(block.data.totalFee));
        }

        this.app.get<any>(Container.Identifiers.StateStore).clearCachedTransactionIds();
    }

    public async buildWallets(): Promise<void> {
        this.poolWalletRepository.reset();

        const transactionIds: string[] = await this.getTransactionIdsForForging(0, await this.getPoolSize());

        this.app.get<any>(Container.Identifiers.StateStore).clearCachedTransactionIds();

        for (const transactionId of transactionIds) {
            const transaction: Interfaces.ITransaction | undefined = await this.getTransaction(transactionId);

            if (!transaction || !transaction.data.senderPublicKey) {
                return;
            }

            const senderWallet: Contracts.State.Wallet = this.poolWalletRepository.findByPublicKey(
                transaction.data.senderPublicKey,
            );

            // TODO: rework error handling
            try {
                const transactionHandler: Handlers.TransactionHandler = await this.app
                    .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
                    .get(transaction.data);
                await transactionHandler.throwIfCannotBeApplied(transaction, senderWallet, this.walletRepository);
                await transactionHandler.applyToSender(transaction, this.poolWalletRepository);
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

        this.poolWalletRepository.forget(senderPublicKey);
    }

    public async purgeInvalidTransactions(): Promise<void> {
        return this.purgeTransactions(AppEnums.TransactionEvent.RemovedFromPool, this.memory.getInvalid());
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
        this.poolWalletRepository.reset();

        for (const transaction of transactions) {
            try {
                const handler: Handlers.TransactionHandler = await this.app
                    .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
                    .get(transaction.data);

                await handler.applyToSender(transaction, this.poolWalletRepository);
                await handler.applyToRecipient(transaction, this.poolWalletRepository);

                this.memory.remember(transaction);
            } catch (error) {
                this.logger.error(`[Pool] Transaction (${transaction.id}): ${error.message}`);
            }
        }
    }

    private async getValidatedTransactions(
        start: number,
        size: number,
        maxBytes = 0,
    ): Promise<Interfaces.ITransaction[]> {
        await this.purgeExpired();

        const data: Interfaces.ITransaction[] = [];

        let transactionBytes = 0;

        const tempWalletRepository: Wallets.TempWalletRepository = this.app
            .resolve<Wallets.TempWalletRepository>(Wallets.TempWalletRepository)
            .setup(this.walletRepository);

        let i = 0;
        // Copy the returned array because validateTransactions() in the loop body we may remove entries.
        const allTransactions: Interfaces.ITransaction[] = [...this.memory.allSortedByFee()];
        for (const transaction of allTransactions) {
            if (data.length === size) {
                return data;
            }

            const valid: Interfaces.ITransaction[] = await this.validateTransactions(
                [transaction],
                tempWalletRepository,
            );

            if (valid.length === 0) {
                continue;
            }

            if (i++ < start) {
                continue;
            }

            if (maxBytes > 0) {
                const transactionSize: number = JSON.stringify(transaction.data).length;

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
    ): Promise<Contracts.TransactionPool.AddTransactionResponse> {
        AppUtils.assert.defined<string>(transaction.id);

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
            const lowest: Interfaces.ITransaction | undefined = all[all.length - 1];

            AppUtils.assert.defined<string>(lowest.id);

            const fee: Utils.BigNumber = transaction.data.fee;
            const lowestFee: Utils.BigNumber = lowest.data.fee;

            if (lowestFee.isLessThan(fee)) {
                await this.poolWalletRepository.revertTransactionForSender(lowest);
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
            await this.poolWalletRepository.throwIfCannotBeApplied(transaction);

            const handler: Handlers.TransactionHandler = await this.app
                .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
                .get(transaction.data);
            await handler.applyToSender(transaction, this.poolWalletRepository);
        } catch (error) {
            this.logger.error(`[Pool] ${error.message}`);

            AppUtils.assert.defined<string>(transaction.id);

            this.memory.forget(transaction.id);

            console.log(error);

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
        walletRepository?: Wallets.TempWalletRepository,
    ): Promise<Interfaces.ITransaction[]> {
        const validTransactions: Interfaces.ITransaction[] = [];
        const forgedIds: string[] = await this.removeForgedTransactions(transactions);

        const unforgedTransactions: Interfaces.ITransaction[] = differenceWith(transactions, forgedIds, (t, forgedId) => t.id === forgedId);

        if (walletRepository === undefined) {
            walletRepository = this.app
                .resolve<Wallets.TempWalletRepository>(Wallets.TempWalletRepository)
                .setup(this.walletRepository);
        }

        for (const transaction of unforgedTransactions) {
            try {
                const deserialized: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytes(
                    transaction.serialized,
                );

                strictEqual(transaction.id, deserialized.id);

                const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
                    transaction.data.senderPublicKey!,
                );

                let recipient: Contracts.State.Wallet | undefined;

                if (transaction.data.recipientId) {
                    recipient = walletRepository.findByAddress(transaction.data.recipientId);
                }

                const handler: Handlers.TransactionHandler = await this.app
                    .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
                    .get(transaction.data);

                await handler.applyToSender(transaction, walletRepository);

                if (recipient && sender.address !== recipient.address) {
                    await handler.applyToRecipient(transaction, walletRepository);
                }

                validTransactions.push(transaction);
            } catch (error) {
                console.error(error.stack);
                this.removeTransactionById(transaction.id!);

                this.logger.error(
                    `[Pool] Removed ${transaction.id} before forging because it is no longer valid: ${error.message}`,
                );
            }
        }

        return validTransactions;
    }

    private async removeForgedTransactions(transactions: Interfaces.ITransaction[]): Promise<string[]> {
        const forgedIds: string[] = await this.transactionRepository.getForgedTransactionsIds(
            transactions.map(({ id }) => {
                AppUtils.assert.defined<string>(id);

                return id;
            }),
        );

        this.removeTransactionsById(forgedIds);
        return forgedIds;
    }

    private async purgeExpired(): Promise<void> {
        return this.purgeTransactions(AppEnums.TransactionEvent.Expired, this.memory.getExpired());
    }

    /**
     * Remove all provided transactions plus any transactions from the same senders with higher nonces.
     */
    private async purgeTransactions(event: string, transactions: Interfaces.ITransaction[]): Promise<void> {
        const purge = async (transaction: Interfaces.ITransaction) => {
            this.emitter.dispatch(event, transaction.data);

            await this.poolWalletRepository.revertTransactionForSender(transaction);

            AppUtils.assert.defined<Interfaces.ITransaction>(transaction.id);

            this.memory.forget(transaction.id, transaction.data.senderPublicKey);

            this.syncToPersistentStorageIfNecessary();
        };

        const lowestNonceBySender = {};
        for (const transaction of transactions) {
            if (transaction.data.version === 1) {
                await purge(transaction);
                continue;
            }

            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

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
                AppUtils.assert.defined<AppUtils.BigNumber>(a.data.nonce);
                AppUtils.assert.defined<AppUtils.BigNumber>(b.data.nonce);

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

                AppUtils.assert.defined<AppUtils.BigNumber>(transaction.data.nonce);
                AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

                const nonce: AppUtils.BigNumber = transaction.data.nonce;
                const senderPublicKey: string = transaction.data.senderPublicKey;

                if (nonce.isEqualTo(lowestNonceBySender[senderPublicKey])) {
                    break;
                }
            }
        }
    }

    public canBePurged(wallet: Contracts.State.Wallet): boolean {
        const attributes: object = wallet.getAttributes();

        const hasAttributes: boolean = !!attributes && Object.keys(attributes).length > 0;

        if (wallet.hasAttribute("htlc.lockedBalance")) {
            const lockedBalance: AppUtils.BigNumber = wallet.getAttribute("htlc.lockedBalance");

            if (!lockedBalance.isZero()) {
                return false;
            }
        }

        return wallet.balance.isZero() && !hasAttributes;
    }
}
