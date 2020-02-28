import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { TransactionAlreadyInPoolError, TransactionPoolFullError } from "./errors";

@Container.injectable()
export class Service implements Contracts.TransactionPool.Service {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionPoolStorage)
    private readonly storage!: Contracts.TransactionPool.Storage;

    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Contracts.TransactionPool.Memory;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionPoolExpirationService)
    private readonly expirationService!: Contracts.TransactionPool.ExpirationService;

    public async boot(): Promise<void> {
        if (process.env.CORE_RESET_DATABASE) {
            this.flush();
        }
        await this.readdTransactions();
    }

    public getPoolSize(): number {
        return this.memory.getSize();
    }

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.hasTransaction(transaction.id)) {
            throw new TransactionAlreadyInPoolError(transaction);
        }
        this.storage.addTransaction(transaction);

        try {
            await this.addTransactionToMempool(transaction);
            this.logger.debug(`${transaction} added to pool`);
        } catch (error) {
            this.storage.removeTransaction(transaction.id);
            throw error;
        }
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.hasTransaction(transaction.id) === false) {
            throw new Error("Unknown transaction");
        }

        for (const removedTransaction of await this.memory.removeTransaction(transaction)) {
            AppUtils.assert.defined<string>(removedTransaction.id);
            this.storage.removeTransaction(removedTransaction.id);
            this.logger.debug(`${removedTransaction} removed from pool`);
        }
    }

    public acceptForgedTransaction(transaction: Interfaces.ITransaction): void {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.hasTransaction(transaction.id) === false) {
            return;
        }

        for (const removedTransaction of this.memory.acceptForgedTransaction(transaction)) {
            AppUtils.assert.defined<string>(removedTransaction.id);
            this.storage.removeTransaction(removedTransaction.id);
            this.logger.debug(`${removedTransaction} removed from pool`);
        }

        this.logger.debug(`${transaction} forged and accepted by pool`);
    }

    public async readdTransactions(prevTransactions?: Interfaces.ITransaction[]): Promise<void> {
        this.memory.flush();

        let prevCount = 0;
        let rebuiltCount = 0;

        if (prevTransactions) {
            for (const transaction of prevTransactions) {
                try {
                    await this.addTransactionToMempool(transaction);
                    this.storage.addTransaction(transaction);
                    prevCount++;
                    rebuiltCount++;
                } catch (error) {}
            }
        }

        for (const transaction of this.storage.getAllTransactions()) {
            try {
                await this.addTransactionToMempool(transaction);
                rebuiltCount++;
            } catch (error) {
                AppUtils.assert.defined<string>(transaction.id);
                this.storage.removeTransaction(transaction.id);
            }
        }

        this.logger.debug(
            `${AppUtils.pluralize("transaction", rebuiltCount, true)} re-added to pool (${prevCount} previous)`,
        );
    }

    public async cleanUp(): Promise<void> {
        await this.cleanExpired();
        await this.cleanLowestPriority();
    }

    public flush(): void {
        this.memory.flush();
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
            const lowest = this.poolQuery.getAllFromLowestPriority().first();
            if (transaction.data.fee.isLessThanEqual(lowest.data.fee)) {
                throw new TransactionPoolFullError(transaction, lowest.data.fee);
            }
        }

        await this.memory.addTransaction(transaction);
        await this.cleanLowestPriority();
    }

    private async cleanExpired(): Promise<void> {
        for (const transaction of this.poolQuery.getAll()) {
            if (this.expirationService.isTransactionExpired(transaction)) {
                this.logger.warning(`${transaction} expired`);
                await this.removeTransaction(transaction);
            }
        }
    }

    private async cleanLowestPriority(): Promise<void> {
        const maxTransactionsInPool = this.configuration.getRequired<number>("maxTransactionsInPool");
        while (this.getPoolSize() > maxTransactionsInPool) {
            const lowest = this.poolQuery.getAllFromLowestPriority().first();
            await this.removeTransaction(lowest);
        }
    }
}
