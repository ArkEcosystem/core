import { Container, Contracts, Enums, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { TransactionAlreadyInPoolError, TransactionPoolFullError } from "./errors";

@Container.injectable()
export class Service implements Contracts.TransactionPool.Service {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

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
        this.events.listen(Enums.BlockEvent.Applied, this);

        if (process.env.CORE_RESET_DATABASE || process.env.CORE_RESET_POOL) {
            await this.flush();
        }
    }

    public dispose(): void {
        this.events.forget(Enums.CryptoEvent.MilestoneChanged, this);
        this.events.forget(Enums.StateEvent.BuilderFinished, this);
        this.events.forget(Enums.BlockEvent.Applied, this);

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
                case Enums.BlockEvent.Applied:
                    await this.cleanUp();
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
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            if (this.storage.hasTransaction(transaction.id)) {
                throw new TransactionAlreadyInPoolError(transaction);
            }

            this.storage.addTransaction({
                height: this.stateStore.getLastHeight(),
                id: transaction.id,
                senderPublicKey: transaction.data.senderPublicKey,
                serialized: transaction.serialized,
            });

            try {
                await this.dynamicFeeMatcher.throwIfCannotEnterPool(transaction);
                await this.addTransactionToMempool(transaction);
                this.logger.debug(`${transaction} added to pool`);
                this.events.dispatch(Enums.TransactionEvent.AddedToPool, transaction.data);
            } catch (error) {
                this.storage.removeTransaction(transaction.id);
                this.logger.warning(`${transaction} failed to enter pool: ${error.message}`);
                this.events.dispatch(Enums.TransactionEvent.RejectedByPool, transaction.data);

                throw error instanceof Contracts.TransactionPool.PoolError
                    ? error
                    : new Contracts.TransactionPool.PoolError(error.message, "ERR_OTHER");
            }
        });
    }

    public async readdTransactions(previouslyForgedTransactions: Interfaces.ITransaction[] = []): Promise<void> {
        await this.lock.runExclusive(async () => {
            if (this.disposed) {
                return;
            }

            this.mempool.flush();

            let previouslyForgedSuccesses = 0;
            let previouslyForgedFailures = 0;
            let previouslyStoredSuccesses = 0;
            let previouslyStoredExpirations = 0;
            let previouslyStoredFailures = 0;

            const previouslyForgedStoredIds: string[] = [];

            for (const { id, serialized } of previouslyForgedTransactions) {
                try {
                    const previouslyForgedTransaction = Transactions.TransactionFactory.fromBytes(serialized);

                    AppUtils.assert.defined<string>(previouslyForgedTransaction.id);
                    AppUtils.assert.defined<string>(previouslyForgedTransaction.data.senderPublicKey);

                    await this.addTransactionToMempool(previouslyForgedTransaction);

                    this.storage.addTransaction({
                        height: this.stateStore.getLastHeight(),
                        id: previouslyForgedTransaction.id,
                        senderPublicKey: previouslyForgedTransaction.data.senderPublicKey,
                        serialized: previouslyForgedTransaction.serialized,
                    });

                    previouslyForgedStoredIds.push(previouslyForgedTransaction.id);

                    previouslyForgedSuccesses++;
                } catch (error) {
                    this.logger.debug(`Failed to re-add previously forged transaction ${id}: ${error.message}`);
                    previouslyForgedFailures++;
                }
            }

            const maxTransactionAge: number = this.configuration.getRequired<number>("maxTransactionAge");
            const lastHeight: number = this.stateStore.getLastHeight();
            const expiredHeight: number = lastHeight - maxTransactionAge;

            for (const { height, id, serialized } of this.storage.getAllTransactions()) {
                if (previouslyForgedStoredIds.includes(id)) {
                    continue;
                }

                if (height > expiredHeight) {
                    try {
                        const previouslyStoredTransaction = Transactions.TransactionFactory.fromBytes(serialized);
                        await this.addTransactionToMempool(previouslyStoredTransaction);
                        previouslyStoredSuccesses++;
                    } catch (error) {
                        this.storage.removeTransaction(id);
                        this.logger.debug(`Failed to re-add previously stored transaction ${id}: ${error.message}`);
                        previouslyStoredFailures++;
                    }
                } else {
                    this.storage.removeTransaction(id);
                    this.logger.debug(`Not re-adding previously stored expired transaction ${id}`);
                    previouslyStoredExpirations++;
                }
            }

            if (previouslyForgedSuccesses >= 1) {
                this.logger.info(`${previouslyForgedSuccesses} previously forged transactions re-added`);
            }
            if (previouslyForgedFailures >= 1) {
                this.logger.warning(`${previouslyForgedFailures} previously forged transactions failed re-adding`);
            }
            if (previouslyStoredSuccesses >= 1) {
                this.logger.info(`${previouslyStoredSuccesses} previously stored transactions re-added`);
            }
            if (previouslyStoredExpirations >= 1) {
                this.logger.info(`${previouslyStoredExpirations} previously stored transactions expired`);
            }
            if (previouslyStoredFailures >= 1) {
                this.logger.warning(`${previouslyStoredFailures} previously stored transactions failed re-adding`);
            }
        });
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            if (this.storage.hasTransaction(transaction.id) === false) {
                this.logger.error(`Failed to remove ${transaction} that isn't in pool`);
                return;
            }

            const removedTransactions = await this.mempool.removeTransaction(
                transaction.data.senderPublicKey,
                transaction.id,
            );

            for (const removedTransaction of removedTransactions) {
                AppUtils.assert.defined<string>(removedTransaction.id);
                this.storage.removeTransaction(removedTransaction.id);
                this.logger.debug(`Removed ${removedTransaction}`);
                this.events.dispatch(Enums.TransactionEvent.RemovedFromPool, removedTransaction.data);
            }

            if (!removedTransactions.find((t) => t.id === transaction.id)) {
                this.storage.removeTransaction(transaction.id);
                this.logger.error(`Removed ${transaction} from storage`);
                this.events.dispatch(Enums.TransactionEvent.RemovedFromPool, transaction.data);
            }
        });
    }

    public async removeForgedTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            if (this.storage.hasTransaction(transaction.id) === false) {
                return;
            }

            const removedTransactions = await this.mempool.removeForgedTransaction(
                transaction.data.senderPublicKey,
                transaction.id,
            );

            for (const removedTransaction of removedTransactions) {
                AppUtils.assert.defined<string>(removedTransaction.id);
                this.storage.removeTransaction(removedTransaction.id);
                this.logger.debug(`Removed forged ${removedTransaction}`);
            }

            if (!removedTransactions.find((t) => t.id === transaction.id)) {
                this.storage.removeTransaction(transaction.id);
                this.logger.error(`Removed forged ${transaction} from storage`);
            }
        });
    }

    public async cleanUp(): Promise<void> {
        await this.lock.runNonExclusive(async () => {
            if (this.disposed) {
                return;
            }

            await this.removeOldTransactions();
            await this.removeExpiredTransactions();
            await this.removeLowestPriorityTransactions();
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

    private async removeOldTransactions(): Promise<void> {
        const maxTransactionAge: number = this.configuration.getRequired<number>("maxTransactionAge");
        const lastHeight: number = this.stateStore.getLastHeight();
        const expiredHeight: number = lastHeight - maxTransactionAge;

        for (const { senderPublicKey, id } of this.storage.getOldTransactions(expiredHeight)) {
            const removedTransactions = await this.mempool.removeTransaction(senderPublicKey, id);

            for (const removedTransaction of removedTransactions) {
                AppUtils.assert.defined<string>(removedTransaction.id);
                this.storage.removeTransaction(removedTransaction.id);
                this.logger.info(`Removed old ${removedTransaction}`);
                this.events.dispatch(Enums.TransactionEvent.Expired, removedTransaction.data);
            }
        }
    }

    private async removeExpiredTransactions(): Promise<void> {
        for (const transaction of this.poolQuery.getAll()) {
            AppUtils.assert.defined<string>(transaction.id);
            AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

            if (await this.expirationService.isExpired(transaction)) {
                const removedTransactions = await this.mempool.removeTransaction(
                    transaction.data.senderPublicKey,
                    transaction.id,
                );

                for (const removedTransaction of removedTransactions) {
                    AppUtils.assert.defined<string>(removedTransaction.id);
                    this.storage.removeTransaction(removedTransaction.id);
                    this.logger.info(`Removed expired ${removedTransaction}`);
                    this.events.dispatch(Enums.TransactionEvent.Expired, removedTransaction.data);
                }
            }
        }
    }

    private async removeLowestPriorityTransaction(): Promise<void> {
        if (this.getPoolSize() === 0) {
            return;
        }

        const transaction = this.poolQuery.getFromLowestPriority().first();

        AppUtils.assert.defined<string>(transaction.id);
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const removedTransactions = await this.mempool.removeTransaction(
            transaction.data.senderPublicKey,
            transaction.id,
        );

        for (const removedTransaction of removedTransactions) {
            AppUtils.assert.defined<string>(removedTransaction.id);
            this.storage.removeTransaction(removedTransaction.id);
            this.logger.info(`Removed lowest priority ${removedTransaction}`);
            this.events.dispatch(Enums.TransactionEvent.RemovedFromPool, removedTransaction.data);
        }
    }

    private async removeLowestPriorityTransactions(): Promise<void> {
        const maxTransactionsInPool: number = this.configuration.getRequired<number>("maxTransactionsInPool");

        while (this.getPoolSize() > maxTransactionsInPool) {
            await this.removeLowestPriorityTransaction();
        }
    }

    private async addTransactionToMempool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionsInPool: number = this.configuration.getRequired<number>("maxTransactionsInPool");

        if (this.getPoolSize() >= maxTransactionsInPool) {
            await this.removeOldTransactions();
            await this.removeExpiredTransactions();
            await this.removeLowestPriorityTransactions();
        }

        if (this.getPoolSize() >= maxTransactionsInPool) {
            const lowest = this.poolQuery.getFromLowestPriority().first();
            if (transaction.data.fee.isLessThanEqual(lowest.data.fee)) {
                throw new TransactionPoolFullError(transaction, lowest.data.fee);
            }

            await this.removeLowestPriorityTransaction();
        }

        await this.mempool.addTransaction(transaction);
    }
}
