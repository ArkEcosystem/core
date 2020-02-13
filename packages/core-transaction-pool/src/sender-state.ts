import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";

import { DynamicFeeMatcher } from "./dynamic-fee-matcher";
import { ExceedsMaxCountError, ExpiredError, LowFeeError, ToLargeError } from "./errors";
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
    @Container.tagged("state", "cow")
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(ExpirationService)
    private readonly expirationService!: ExpirationService;

    @Container.inject(DynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: DynamicFeeMatcher;

    private readonly transactions: Interfaces.ITransaction[] = [];

    public get size(): number {
        return this.transactions.length;
    }

    public getFromEarliestNonce(): Iterable<Interfaces.ITransaction> {
        return this.transactions.slice();
    }

    public getFromLatestNonce(): Iterable<Interfaces.ITransaction> {
        return this.transactions.slice().reverse();
    }

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionBytes = this.configuration.getRequired<number>("maxTransactionBytes");
        const maxTransactionsPerSender = this.configuration.getRequired<number>("maxTransactionsPerSender");
        const allowedSenders = this.configuration.getOptional<string[]>("allowedSenders", []);

        try {
            if (this.size >= maxTransactionsPerSender) {
                if (!allowedSenders.includes(transaction.data.senderPublicKey)) {
                    throw new ExceedsMaxCountError(transaction, maxTransactionsPerSender);
                }
            }

            if (this.expirationService.isTransactionExpired(transaction)) {
                const expiredBlocksCount = this.expirationService.getTransactionExpiredBlocksCount(transaction);
                throw new ExpiredError(transaction, expiredBlocksCount);
            }

            if (JSON.stringify(transaction.data).length > maxTransactionBytes) {
                throw new ToLargeError(transaction, maxTransactionBytes);
            }

            const dynamicFee = await this.dynamicFeeMatcher.match(transaction);
            if (!dynamicFee.enterPool) {
                throw new LowFeeError(transaction);
            }

            const handler = await this.handlerRegistry.getActivatedHandlerForData(transaction.data);
            await handler.throwIfCannotEnterPool(transaction);
            await handler.apply(transaction);
            this.transactions.push(transaction);
            this.logger.info(`Pool ${describeTransaction(transaction)} applied`);
        } catch (error) {
            this.logger.warning(`Pool ${describeTransaction(transaction)} apply failed: ${error.message}`);
            throw error;
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
