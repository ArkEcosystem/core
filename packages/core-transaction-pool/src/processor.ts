import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { InvalidTransactionDataError } from "./errors";

@Container.injectable()
export class Processor implements Contracts.TransactionPool.Processor {
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

        try {
            for (const transactionData of data) {
                const id = transactionData.id;
                AppUtils.assert.defined<string>(id);

                try {
                    const transaction = await this.getTransactionFromData(transactionData);
                    await this.pool.addTransaction(transaction);
                    this.accept.push(id);

                    try {
                        await this.dynamicFeeMatcher.throwIfCannotBroadcast(transaction);
                        broadcastableTransactions.push(transaction);
                    } catch {}
                } catch (error) {
                    this.invalid.push(id);

                    if (error instanceof Contracts.TransactionPool.PoolError) {
                        if (error.type === "ERR_EXCEEDS_MAX_COUNT") {
                            this.excess.push(id);
                        }

                        if (!this.errors) this.errors = {};
                        this.errors[id] = {
                            type: error.type,
                            message: error.message,
                        };
                    } else {
                        throw error;
                    }
                }
            }
        } finally {
            if (this.transactionBroadcaster && broadcastableTransactions.length !== 0) {
                this.transactionBroadcaster.broadcastTransactions(broadcastableTransactions);
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
        try {
            if (this.workerPool.isTypeGroupSupported(transactionData.typeGroup!)) {
                return await this.workerPool.getTransactionFromData(transactionData);
            } else {
                return Transactions.TransactionFactory.fromData(transactionData);
            }
        } catch (error) {
            throw new InvalidTransactionDataError(error.message);
        }
    }
}
