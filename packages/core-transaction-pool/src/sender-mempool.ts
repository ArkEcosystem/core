import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { SenderExceededMaximumTransactionCountError } from "./errors";

@Container.injectable()
export class SenderMempool implements Contracts.TransactionPool.SenderMempool {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.TransactionPoolSenderState)
    private readonly senderState!: Contracts.TransactionPool.SenderState;

    private concurrency: number = 0;

    private readonly lock: AppUtils.Lock = new AppUtils.Lock();

    private readonly transactions: Interfaces.ITransaction[] = [];

    public isDisposable(): boolean {
        return this.transactions.length === 0 && this.concurrency === 0;
    }

    public getSize(): number {
        return this.transactions.length;
    }

    public getFromEarliest(): Iterable<Interfaces.ITransaction> {
        return this.transactions.slice();
    }

    public getFromLatest(): Iterable<Interfaces.ITransaction> {
        return this.transactions.slice().reverse();
    }

    public async addTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        try {
            this.concurrency++;

            await this.lock.runExclusive(async () => {
                AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

                const maxTransactionsPerSender: number = this.configuration.getRequired<number>(
                    "maxTransactionsPerSender",
                );
                if (this.transactions.length >= maxTransactionsPerSender) {
                    const allowedSenders: string[] = this.configuration.getOptional<string[]>("allowedSenders", []);
                    if (!allowedSenders.includes(transaction.data.senderPublicKey)) {
                        throw new SenderExceededMaximumTransactionCountError(transaction, maxTransactionsPerSender);
                    }
                }

                await this.senderState.apply(transaction);
                this.transactions.push(transaction);
            });
        } finally {
            this.concurrency--;
        }
    }

    public async removeTransaction(id: string): Promise<Interfaces.ITransaction[]> {
        try {
            this.concurrency++;

            return await this.lock.runExclusive(async () => {
                const index = this.transactions.findIndex((t) => t.id === id);
                if (index === -1) {
                    return [];
                }

                const removedTransactions: Interfaces.ITransaction[] = this.transactions
                    .splice(index, this.transactions.length - index)
                    .reverse();

                try {
                    for (const removedTransaction of removedTransactions) {
                        await this.senderState.revert(removedTransaction);
                    }
                    return removedTransactions;
                } catch (error) {
                    const otherRemovedTransactions = this.transactions.splice(0, this.transactions.length).reverse();
                    return [...removedTransactions, ...otherRemovedTransactions];
                }
            });
        } finally {
            this.concurrency--;
        }
    }

    public async removeForgedTransaction(id: string): Promise<Interfaces.ITransaction[]> {
        try {
            this.concurrency++;

            const index: number = this.transactions.findIndex((t) => t.id === id);

            if (index !== -1) {
                return this.transactions.splice(0, index + 1);
            } else {
                return []; // TODO: implement this.reboot();
            }
        } finally {
            this.concurrency--;
        }
    }
}
