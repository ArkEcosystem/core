import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";

import {
    SenderExceededMaximumTransactionCountError,
    TransactionExceedsMaximumByteSizeError,
    TransactionHasExpiredError,
    TransactionFailedToApplyError,
} from "./errors";
import { ExpirationService } from "./expiration-service";
import { describeTransaction } from "./utils";

@Container.injectable()
export class SenderState implements Contracts.TransactionPool.SenderState {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "copy-on-write")
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(ExpirationService)
    private readonly expirationService!: ExpirationService;

    private readonly transactions: Interfaces.ITransaction[] = [];

    public getTransactionsCount(): number {
        return this.transactions.length;
    }

    public getTransactionsFromEarliestNonce(): Iterable<Interfaces.ITransaction> {
        return this.transactions.slice();
    }

    public getTransactionsFromLatestNonce(): Iterable<Interfaces.ITransaction> {
        return this.transactions.slice().reverse();
    }

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionBytes = this.configuration.getRequired<number>("maxTransactionBytes");
        const maxTransactionsPerSender = this.configuration.getRequired<number>("maxTransactionsPerSender");
        const allowedSenders = this.configuration.getOptional<string[]>("allowedSenders", []);

        if (this.getTransactionsCount() >= maxTransactionsPerSender) {
            if (!allowedSenders.includes(transaction.data.senderPublicKey)) {
                throw new SenderExceededMaximumTransactionCountError(transaction, maxTransactionsPerSender);
            }
        }

        if (this.expirationService.isTransactionExpired(transaction)) {
            const expiredBlocksCount = this.expirationService.getTransactionExpiredBlocksCount(transaction);
            throw new TransactionHasExpiredError(transaction, expiredBlocksCount);
        }

        if (JSON.stringify(transaction.data).length > maxTransactionBytes) {
            throw new TransactionExceedsMaximumByteSizeError(transaction, maxTransactionBytes);
        }

        const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);

        try {
            await handler.throwIfCannotEnterPool(transaction);
            await handler.apply(transaction);
            this.transactions.push(transaction);
            this.logger.info(`Pool ${describeTransaction(transaction)} applied`);
        } catch (error) {
            this.logger.warning(`Pool ${describeTransaction(transaction)} apply failed: ${error.message}`);
            throw new TransactionFailedToApplyError(transaction, error);
        }
    }

    public async revert(): Promise<Interfaces.ITransaction> {
        const transaction = this.transactions.pop();
        if (!transaction) {
            throw new Error("Empty state");
        }

        try {
            const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);
            await handler.revert(transaction);
            this.logger.info(`Pool ${describeTransaction(transaction)} reverted`);
            return transaction;
        } catch (error) {
            this.logger.warning(`Pool ${describeTransaction(transaction)} revert failed: ${error.message}`);
            this.transactions.push(transaction);
            throw error;
        }
    }

    public async remove(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        if (this.transactions.length === 0) {
            throw new Error("Empty state");
        }

        let removed: Interfaces.ITransaction[] = [];
        while (this.transactions.length) {
            if (!this.transactions.find(t => t.id === transaction.id)) {
                throw new Error("Unknown transaction");
            }

            removed = removed.concat(await this.revert());
            if (removed.find(t => t.id === transaction.id)) {
                break;
            }
        }
        return removed;
    }

    public accept(transaction: Interfaces.ITransaction): Interfaces.ITransaction[] {
        const index = this.transactions.findIndex(t => t.id === transaction.id);
        if (index === -1) {
            throw new Error("Unknown transaction");
        }

        if (index === 0) {
            this.transactions.shift();
            this.logger.debug(`Pool ${describeTransaction(transaction)} accepted being lowest nonce`);
            return [transaction];
        } else {
            this.logger.debug(`Pool ${describeTransaction(transaction)} accepted and ${index} previous transactions`);
            return this.transactions.splice(0, index + 1);
        }
    }
}
