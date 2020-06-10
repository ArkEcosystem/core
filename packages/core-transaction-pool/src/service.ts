import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Enums, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { TransactionAlreadyInPoolError, TransactionPoolFullError } from "./errors";

@Container.injectable()
export class Service implements Contracts.TransactionPool.Service {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoSuite.CryptoManager;

    @Container.inject(Container.Identifiers.TransactionManager)
    private readonly transactionsManager!: CryptoSuite.TransactionManager;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionPoolStorage)
    private readonly storage!: Contracts.TransactionPool.Storage;

    @Container.inject(Container.Identifiers.TransactionPoolMempool)
    private readonly mempool!: Contracts.TransactionPool.Mempool;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionPoolExpirationService)
    private readonly expirationService!: Contracts.TransactionPool.ExpirationService;

    public async boot(): Promise<void> {
        this.emitter.listen(Enums.CryptoEvent.MilestoneChanged, {
            handle: () => this.readdTransactions(),
        });

        if (process.env.CORE_RESET_DATABASE || process.env.CORE_RESET_POOL) {
            this.flush();
        } else {
            await this.readdTransactions();
        }
    }

    public getPoolSize(): number {
        return this.mempool.getSize();
    }

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.hasTransaction(transaction.id)) {
            throw new TransactionAlreadyInPoolError(transaction);
        }

        this.storage.addTransaction(transaction.id, transaction.serialized);
        try {
            await this.addTransactionToMempool(transaction);
            this.logger.debug(`${transaction} added to pool`);
            this.emitter.dispatch(Enums.TransactionEvent.AddedToPool, transaction.data);
        } catch (error) {
            this.storage.removeTransaction(transaction.id);
            this.emitter.dispatch(Enums.TransactionEvent.RejectedByPool, transaction.data);
            throw error;
        }
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<void> {
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

        this.emitter.dispatch(Enums.TransactionEvent.RemovedFromPool, transaction.data);
    }

    public async acceptForgedTransaction(transaction: Interfaces.ITransaction): Promise<void> {
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
    }

    public async readdTransactions(prevTransactions?: Interfaces.ITransaction[]): Promise<void> {
        this.mempool.flush();

        let precedingSuccessCount = 0;
        let precedingErrorCount = 0;
        let pendingSuccessCount = 0;
        let pendingErrorCount = 0;

        if (prevTransactions) {
            for (const transaction of prevTransactions) {
                try {
                    await this.addTransactionToMempool(transaction);
                    AppUtils.assert.defined<string>(transaction.id);
                    this.storage.addTransaction(transaction.id, transaction.serialized);
                    precedingSuccessCount++;
                } catch (error) {
                    precedingErrorCount++;
                }
            }
        }

        for (const { id, serialized } of this.storage.getAllTransactions()) {
            try {
                const transaction = this.transactionsManager.TransactionFactory.fromBytes(serialized);
                await this.addTransactionToMempool(transaction);
                pendingSuccessCount++;
            } catch (error) {
                this.storage.removeTransaction(id);
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
    }

    public async cleanUp(): Promise<void> {
        await this.cleanExpired();
        await this.cleanLowestPriority();
    }

    public flush(): void {
        this.mempool.flush();
        this.storage.flush();
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
                throw new TransactionPoolFullError(transaction, lowest.data.fee, this.cryptoManager);
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

                this.emitter.dispatch(Enums.TransactionEvent.Expired, transaction.data);
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
