import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { DuplicateError, PoolFullError } from "./errors";
import { ExpirationService } from "./expiration-service";
import { describeTransaction } from "./utils";

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

    @Container.inject(ExpirationService)
    private readonly expirationService!: ExpirationService;

    public async boot(): Promise<void> {
        if (process.env.CORE_RESET_DATABASE) {
            this.clear();
        }
        await this.rebuild();
    }

    public getPoolSize(): number {
        return this.memory.getSize();
    }

    public clear(): void {
        this.memory.clear();
        this.storage.clear();
    }

    public async rebuild(): Promise<void> {
        this.memory.clear();

        let rebuiltCount = 0;
        for (const transaction of this.storage.all()) {
            try {
                await this.apply(transaction);
                rebuiltCount++;
            } catch (error) {
                AppUtils.assert.defined<string>(transaction.id);
                this.storage.delete(transaction.id);
            }
        }

        this.logger.info(`Pool rebuilt ${rebuiltCount} transactions`);
    }

    public async replay(transactions: Interfaces.ITransaction[]): Promise<void> {
        this.memory.clear();

        let replayedCount = 0;
        for (const transaction of transactions) {
            try {
                await this.apply(transaction);
                this.storage.add(transaction);
                replayedCount++;
            } catch (error) {}
        }

        let rebuiltCount = 0;
        for (const transaction of this.storage.all()) {
            try {
                await this.apply(transaction);
                rebuiltCount++;
            } catch (error) {
                AppUtils.assert.defined<string>(transaction.id);
                this.storage.delete(transaction.id);
            }
        }

        this.logger.info(`Pool replayed ${replayedCount} transactions`);
        this.logger.info(`Pool rebuilt ${rebuiltCount} transactions`);
    }

    public async add(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.has(transaction.id)) {
            throw new DuplicateError(transaction);
        }
        await this.apply(transaction);
        this.storage.add(transaction);
        this.logger.info(`Pool ${describeTransaction(transaction)} added`);
    }

    public async remove(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.has(transaction.id) === false) {
            throw new Error("Unknown transaction");
        }

        for (const removedTransaction of await this.memory.remove(transaction)) {
            AppUtils.assert.defined<string>(removedTransaction.id);
            this.storage.delete(removedTransaction.id);
            this.logger.debug(`Pool ${describeTransaction(removedTransaction)} deleted`);
        }
    }

    public accept(transaction: Interfaces.ITransaction): void {
        AppUtils.assert.defined<string>(transaction.id);
        if (this.storage.has(transaction.id) === false) {
            return;
        }

        for (const removedTransaction of this.memory.accept(transaction)) {
            AppUtils.assert.defined<string>(removedTransaction.id);
            this.storage.delete(removedTransaction.id);
            this.logger.debug(`Pool ${describeTransaction(removedTransaction)} deleted`);
        }
    }

    public async clean(): Promise<void> {
        await this.cleanExpired();
        await this.cleanLowestPriority();
    }

    private async apply(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionsInPool = this.configuration.getRequired<number>("maxTransactionsInPool");

        if (this.getPoolSize() >= maxTransactionsInPool) {
            await this.cleanExpired();
        }

        if (this.getPoolSize() >= maxTransactionsInPool) {
            await this.cleanLowestPriority();
            const lowest = this.getLowestPriority();
            if (transaction.data.fee.isLessThanEqual(lowest.data.fee)) {
                throw new PoolFullError(transaction, lowest.data.fee);
            }
        }

        await this.memory.apply(transaction);
        await this.cleanLowestPriority();
    }

    private async cleanExpired(): Promise<void> {
        for (const transaction of this.poolQuery.all()) {
            if (this.expirationService.isTransactionExpired(transaction)) {
                this.logger.debug(`Pool ${describeTransaction(transaction)} expired`);
                await this.remove(transaction);
            }
        }
    }

    private async cleanLowestPriority(): Promise<void> {
        const maxTransactionsInPool = this.configuration.getRequired<number>("maxTransactionsInPool");
        while (this.getPoolSize() > maxTransactionsInPool) {
            await this.remove(this.getLowestPriority());
        }
    }

    private getLowestPriority(): Interfaces.ITransaction {
        return this.poolQuery.allFromLowestPriority().first();
    }
}
