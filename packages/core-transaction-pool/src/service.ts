import { Container, Contracts, Enums, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { TransactionAlreadyInPoolError, TransactionPoolFullError } from "./errors";

@Container.injectable()
export class Service implements Contracts.TransactionPool.Service {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionPoolDynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: Contracts.TransactionPool.DynamicFeeMatcher;

    @Container.inject(Container.Identifiers.TransactionPoolStorage)
    private readonly storage!: Contracts.TransactionPool.Storage;

    @Container.inject(Container.Identifiers.TransactionPoolMempool)
    private readonly mempool!: Contracts.TransactionPool.Mempool;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionPoolExpirationService)
    private readonly expirationService!: Contracts.TransactionPool.ExpirationService;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private readonly lock: AppUtils.Lock = new AppUtils.Lock();

    private disposed = false;

    public async boot(): Promise<void> {
        this.events.listen(Enums.StateEvent.BuilderFinished, this);
        this.events.listen(Enums.CryptoEvent.MilestoneChanged, this);

        if (process.env.CORE_RESET_DATABASE || process.env.CORE_RESET_POOL) {
            await this.flush();
        }
    }

    public dispose(): void {
        this.events.forget(Enums.CryptoEvent.MilestoneChanged, this);
        this.events.forget(Enums.StateEvent.BuilderFinished, this);
        this.disposed = true;
    }

    public async handle({ name }): Promise<void> {
        try {
            switch (name) {
                case Enums.StateEvent.BuilderFinished:
                    await this.readdTransactions();
                    break;
                case Enums.CryptoEvent.MilestoneChanged:
                    await this.readdTransactions();
                    break;
            }
        } catch (error) {
            this.logger.critical(error.stack);
            throw error;
        }
    }

    public getPoolSize(): number {
        return this.mempool.getSize();
    }

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            AppUtils.assert.defined<string>(transaction.id);

            if (this.storage.hasTransaction(transaction.id)) {
                throw new TransactionAlreadyInPoolError(transaction);
            }

            this.storage.addTransaction(transaction.id, transaction.serialized);

            try {
                await this.dynamicFeeMatcher.throwIfCannotEnterPool(transaction);
                await this.addTransactionToMempool(transaction);
                this.logger.debug(`${transaction} added to pool`);
                this.events.dispatch(Enums.TransactionEvent.AddedToPool, transaction.data);
            } catch (error) {
                this.storage.removeTransaction(transaction.id);
                this.logger.warning(`${transaction} failed to enter pool: ${error.message}`);
                this.events.dispatch(Enums.TransactionEvent.RejectedByPool, transaction.data);
                throw error;
            }
        });
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            AppUtils.assert.defined<string>(transaction.id);
            if (this.storage.hasTransaction(transaction.id) === false) {
                this.logger.error(`${transaction} not found`);
                return;
            }

            const removedTransactions = await this.mempool.removeTransaction(transaction);
            for (const removedTransaction of removedTransactions) {
                AppUtils.assert.defined<string>(removedTransaction.id);
                this.storage.removeTransaction(removedTransaction.id);
                this.logger.debug(`${removedTransaction} removed from pool`);
            }

            if (!removedTransactions.find((t) => t.id === transaction.id)) {
                this.storage.removeTransaction(transaction.id);
                this.logger.error(`${transaction} removed from pool (wasn't in mempool)`);
            }

            this.events.dispatch(Enums.TransactionEvent.RemovedFromPool, transaction.data);
        });
    }

    public async acceptForgedTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            AppUtils.assert.defined<string>(transaction.id);
            if (this.storage.hasTransaction(transaction.id) === false) {
                return;
            }

            const removedTransactions = await this.mempool.acceptForgedTransaction(transaction);
            for (const removedTransaction of removedTransactions) {
                AppUtils.assert.defined<string>(removedTransaction.id);
                this.storage.removeTransaction(removedTransaction.id);
                this.logger.debug(`${removedTransaction} removed from pool`);
            }

            if (removedTransactions.find((t) => t.id === transaction.id)) {
                this.logger.debug(`${transaction} forged and accepted by pool`);
            } else {
                this.storage.removeTransaction(transaction.id);
                this.logger.error(`${transaction} forged and accepted by pool (wasn't in mempool)`);
            }
        });
    }

    public async readdTransactions(precedingTransactions?: Interfaces.ITransaction[]): Promise<void> {
        await this.lock.runExclusive(async () => {
            if (this.disposed) {
                return;
            }

            this.mempool.flush();

            let precedingSuccessCount = 0;
            let precedingErrorCount = 0;
            let pendingSuccessCount = 0;
            let pendingErrorCount = 0;

            if (precedingTransactions) {
                for (const { id, serialized } of precedingTransactions) {
                    try {
                        AppUtils.assert.defined<string>(id);
                        const precedingTransaction = Transactions.TransactionFactory.fromBytes(serialized);
                        await this.addTransactionToMempool(precedingTransaction);
                        this.storage.addTransaction(id, serialized);
                        precedingSuccessCount++;
                    } catch (error) {
                        this.logger.debug(`Failed to re-add and wasn't added to storage: ${error.message}`);
                        precedingErrorCount++;
                    }
                }
            }

            for (const { id, serialized } of this.storage.getAllTransactions()) {
                try {
                    const pendingTransaction = Transactions.TransactionFactory.fromBytes(serialized);
                    await this.addTransactionToMempool(pendingTransaction);
                    pendingSuccessCount++;
                } catch (error) {
                    this.storage.removeTransaction(id);
                    this.logger.debug(`Failed to re-add and was removed from storage: ${error.message}`);
                    pendingErrorCount++;
                }
            }

            if (precedingSuccessCount === 1) {
                this.logger.info(`${precedingSuccessCount} preceding transaction was re-added to pool`);
            }
            if (precedingSuccessCount > 1) {
                this.logger.info(`${precedingSuccessCount} preceding transactions were re-added to pool`);
            }
            if (precedingErrorCount === 1) {
                this.logger.warning(`${precedingErrorCount} preceding transaction was not re-added to pool`);
            }
            if (precedingErrorCount > 1) {
                this.logger.warning(`${precedingErrorCount} preceding transactions were not re-added to pool`);
            }
            if (pendingSuccessCount === 1) {
                this.logger.info(`${pendingSuccessCount} pending transaction was re-added to pool`);
            }
            if (pendingSuccessCount > 1) {
                this.logger.info(`${pendingSuccessCount} pending transactions were re-added to pool`);
            }
            if (pendingErrorCount === 1) {
                this.logger.warning(`${pendingErrorCount} pending transaction was not re-added to pool`);
            }
            if (pendingErrorCount > 1) {
                this.logger.warning(`${pendingErrorCount} pending transactions were not re-added to pool`);
            }
        });
    }

    public async cleanUp(): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            await this.cleanExpired();
            await this.cleanLowestPriority();
        });
    }

    public async flush(): Promise<void> {
        await this.lock.runExclusive(async () => {
            if (this.disposed) {
                return;
            }

            this.mempool.flush();
            this.storage.flush();
        });
    }

    private async addTransactionToMempool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionsInPool: number = this.configuration.getRequired<number>("maxTransactionsInPool");

        if (this.getPoolSize() >= maxTransactionsInPool) {
            await this.cleanExpired();
        }

        if (this.getPoolSize() >= maxTransactionsInPool) {
            await this.cleanLowestPriority();

            const lowest = this.poolQuery.getFromLowestPriority().first();
            if (transaction.data.fee.isLessThanEqual(lowest.data.fee)) {
                throw new TransactionPoolFullError(transaction, lowest.data.fee);
            }
            await this.removeTransaction(lowest);
        }

        await this.mempool.addTransaction(transaction);
    }

    private async cleanExpired(): Promise<void> {
        for (const transaction of this.poolQuery.getAll()) {
            if (await this.expirationService.isExpired(transaction)) {
                this.logger.warning(`${transaction} expired`);
                await this.removeTransaction(transaction);

                this.events.dispatch(Enums.TransactionEvent.Expired, transaction.data);
            }
        }
    }

    private async cleanLowestPriority(): Promise<void> {
        const maxTransactionsInPool = this.configuration.getRequired<number>("maxTransactionsInPool");
        while (this.getPoolSize() > maxTransactionsInPool) {
            const lowest = this.poolQuery.getFromLowestPriority().first();
            await this.removeTransaction(lowest);
        }
    }
}
