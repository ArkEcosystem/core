import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import {
    SenderExceededMaximumTransactionCountError,
    TransactionExceedsMaximumByteSizeError,
    TransactionFailedToApplyError,
    TransactionFailedToVerifyError,
    TransactionFromFutureError,
    TransactionFromWrongNetworkError,
    TransactionHasExpiredError,
} from "./errors";

@Container.injectable()
export class SenderState implements Contracts.TransactionPool.SenderState {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "copy-on-write")
    private readonly handlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.TransactionPoolExpirationService)
    private readonly expirationService!: Contracts.TransactionPool.ExpirationService;

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

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionBytes: number = this.configuration.getRequired<number>("maxTransactionBytes");
        const maxTransactionsPerSender: number = this.configuration.getRequired<number>("maxTransactionsPerSender");
        const allowedSenders: string[] = this.configuration.getOptional<string[]>("allowedSenders", []);

        if (this.getTransactionsCount() >= maxTransactionsPerSender) {
            if (!allowedSenders.includes(transaction.data.senderPublicKey)) {
                throw new SenderExceededMaximumTransactionCountError(transaction, maxTransactionsPerSender);
            }
        }

        if (JSON.stringify(transaction.data).length > maxTransactionBytes) {
            throw new TransactionExceedsMaximumByteSizeError(transaction, maxTransactionBytes);
        }

        const currentNetwork: number = Managers.configManager.get<number>("network.pubKeyHash");
        if (transaction.data.network && transaction.data.network !== currentNetwork) {
            throw new TransactionFromWrongNetworkError(transaction, currentNetwork);
        }

        const now: number = Crypto.Slots.getTime();
        if (transaction.timestamp > now + 3600) {
            const secondsInFuture: number = transaction.timestamp - now;
            throw new TransactionFromFutureError(transaction, secondsInFuture);
        }

        if (this.expirationService.isTransactionExpired(transaction)) {
            const expiredBlocksCount = this.expirationService.getTransactionExpiredBlocksCount(transaction);
            throw new TransactionHasExpiredError(transaction, expiredBlocksCount);
        }

        const handler: Handlers.TransactionHandler = await this.handlerRegistry.getActivatedHandlerForData(
            transaction.data,
        );

        if (await handler.verify(transaction)) {
            try {
                await handler.throwIfCannotEnterPool(transaction);
                await handler.apply(transaction);
                this.transactions.push(transaction);
            } catch (error) {
                throw new TransactionFailedToApplyError(transaction, error);
            }
        } else {
            throw new TransactionFailedToVerifyError(transaction);
        }
    }

    public async popTransaction(): Promise<Interfaces.ITransaction> {
        const transaction: Interfaces.ITransaction | undefined = this.transactions.pop();
        if (!transaction) {
            throw new Error("Empty state");
        }

        try {
            const handler: Handlers.TransactionHandler = await this.handlerRegistry.getActivatedHandlerForData(
                transaction.data,
            );
            await handler.revert(transaction);
            return transaction;
        } catch (error) {
            this.transactions.push(transaction);
            throw error;
        }
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        if (this.transactions.length === 0) {
            throw new Error("Empty state");
        }

        let removed: Interfaces.ITransaction[] = [];
        while (this.transactions.length) {
            if (!this.transactions.find(t => t.id === transaction.id)) {
                throw new Error("Unknown transaction");
            }

            removed = removed.concat(await this.popTransaction());
            if (removed.find(t => t.id === transaction.id)) {
                break;
            }
        }
        return removed;
    }

    public acceptForgedTransaction(transaction: Interfaces.ITransaction): Interfaces.ITransaction[] {
        const index: number = this.transactions.findIndex(t => t.id === transaction.id);
        if (index === -1) {
            throw new Error("Unknown transaction");
        }

        if (index === 0) {
            this.transactions.shift();
            return [transaction];
        } else {
            return this.transactions.splice(0, index + 1);
        }
    }
}
