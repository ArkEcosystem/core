import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import {
    RetryTransactionError,
    SenderExceededMaximumTransactionCountError,
    TransactionExceedsMaximumByteSizeError,
    TransactionFailedToApplyError,
    TransactionFailedToVerifyError,
    TransactionFromFutureError,
    TransactionFromWrongNetworkError,
    TransactionHasExpiredError,
} from "./errors";
import { createLock } from "./utils";

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

    private readonly lock = createLock();

    private corrupt = false;

    public isEmpty(): boolean {
        return this.transactions.length === 0;
    }

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
        this.validateTransaction(transaction);

        const handler: Handlers.TransactionHandler = await this.handlerRegistry.getActivatedHandlerForData(
            transaction.data,
        );

        if (await handler.verify(transaction)) {
            try {
                await this.lock(async () => {
                    if (this.corrupt) {
                        throw new RetryTransactionError(transaction);
                    }

                    await handler.throwIfCannotEnterPool(transaction);
                    await handler.apply(transaction);
                    this.transactions.push(transaction);
                });
            } catch (error) {
                throw new TransactionFailedToApplyError(transaction, error);
            }
        } else {
            throw new TransactionFailedToVerifyError(transaction);
        }
    }

    public async removeTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        return await this.lock(async () => {
            const index = this.transactions.findIndex(t => t.id === transaction.id);
            if (index === -1) {
                return [];
            }

            const removedTransactions: Interfaces.ITransaction[] = this.transactions
                .splice(index, this.transactions.length - index)
                .reverse();

            try {
                for (const removedTransaction of removedTransactions) {
                    const handler: Handlers.TransactionHandler = await this.handlerRegistry.getActivatedHandlerForData(
                        removedTransaction.data,
                    );
                    await handler.revert(transaction);
                }
                return removedTransactions;
            } catch (error) {
                this.corrupt = true;
                const otherRemovedTransactions = this.transactions.splice(0, this.transactions.length).reverse();
                return [...removedTransactions, ...otherRemovedTransactions];
            }
        });
    }

    public async acceptForgedTransaction(transaction: Interfaces.ITransaction): Promise<Interfaces.ITransaction[]> {
        return await this.lock(async () => {
            const index: number = this.transactions.findIndex(t => t.id === transaction.id);
            if (index === -1) {
                return this.transactions.splice(0, this.transactions.length);
            } else {
                return this.transactions.splice(0, index + 1);
            }
        });
    }

    private async validateTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const maxTransactionBytes: number = this.configuration.getRequired<number>("maxTransactionBytes");
        const maxTransactionsPerSender: number = this.configuration.getRequired<number>("maxTransactionsPerSender");
        const allowedSenders: string[] = this.configuration.getOptional<string[]>("allowedSenders", []);

        if (this.transactions.length >= maxTransactionsPerSender) {
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
            const expirationHeight: number | undefined = this.expirationService.getTransactionExpirationHeight(
                transaction,
            );
            throw new TransactionHasExpiredError(transaction, expirationHeight!);
        }
    }
}
