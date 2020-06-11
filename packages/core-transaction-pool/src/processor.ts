import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

@Container.injectable()
export class Processor implements Contracts.TransactionPool.Processor {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly pool!: Contracts.TransactionPool.Service;

    @Container.inject(Container.Identifiers.TransactionPoolDynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: Contracts.TransactionPool.DynamicFeeMatcher;

    @Container.inject(Container.Identifiers.TransactionPoolWorkerPool)
    private readonly workerPool!: Contracts.TransactionPool.WorkerPool;

    @Container.inject(Container.Identifiers.PeerTransactionBroadcaster)
    @Container.optional()
    private readonly transactionBroadcaster!: Contracts.P2P.TransactionBroadcaster | undefined;

    public accept: string[] = [];
    public broadcast: string[] = [];
    public invalid: string[] = [];
    public excess: string[] = [];
    public errors?: { [id: string]: Contracts.TransactionPool.ProcessorError };

    public async process(data: Interfaces.ITransactionData[]): Promise<void> {
        const broadcastableTransactions: Interfaces.ITransaction[] = [];
        const promises = data.map((d) => this.getTransactionFromData(d));
        const transactions = await Promise.all(promises);

        try {
            for (const transaction of transactions) {
                AppUtils.assert.defined<string>(transaction.id);

                try {
                    await this.dynamicFeeMatcher.throwIfCannotEnterPool(transaction);
                    await this.pool.addTransaction(transaction);
                    this.accept.push(transaction.id);

                    try {
                        await this.dynamicFeeMatcher.throwIfCannotBroadcast(transaction);
                        broadcastableTransactions.push(transaction);
                    } catch {}
                } catch (error) {
                    this.invalid.push(transaction.id);

                    if (error instanceof Contracts.TransactionPool.PoolError) {
                        if (error.type === "ERR_EXCEEDS_MAX_COUNT") {
                            this.excess.push(transaction.id);
                        }

                        if (!this.errors) this.errors = {};
                        this.errors[transaction.id] = {
                            type: error.type,
                            message: error.message,
                        };

                        this.logger.warning(`${transaction} failed to enter pool: ${error.message}`);
                    } else {
                        this.logger.error(`${transaction} caused error entering pool: ${error.stack}`);
                        throw error;
                    }
                }
            }
        } finally {
            if (this.transactionBroadcaster && broadcastableTransactions.length !== 0) {
                await this.transactionBroadcaster.broadcastTransactions(broadcastableTransactions);
                for (const transaction of broadcastableTransactions) {
                    AppUtils.assert.defined<string>(transaction.id);
                    this.broadcast.push(transaction.id);
                }
            }
        }
    }

    private async getTransactionFromData(
        transactionData: Interfaces.ITransactionData,
    ): Promise<Interfaces.ITransaction> {
        if (this.workerPool.isTypeGroupSupported(transactionData.typeGroup!)) {
            return this.workerPool.getTransactionFromData(transactionData);
        } else {
            return Transactions.TransactionFactory.fromData(transactionData);
        }
    }
}
