import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { TransactionFeeToLowError } from "./errors";

@Container.injectable()
export class Processor implements Contracts.TransactionPool.Processor {
    public accept: string[] = [];
    public broadcast: string[] = [];
    public invalid: string[] = [];
    public excess: string[] = [];
    public errors?: { [id: string]: Contracts.TransactionPool.ProcessorError };

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly pool!: Contracts.TransactionPool.Connection;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.TransactionPoolDynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: Contracts.TransactionPool.DynamicFeeMatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async process(data: Interfaces.ITransactionData[]): Promise<void> {
        const broadcastable: Interfaces.ITransaction[] = [];
        const transactions = data.map(d => Transactions.TransactionFactory.fromData(d));

        try {
            for (const transaction of transactions) {
                AppUtils.assert.defined<string>(transaction.id);

                try {
                    if (await this.dynamicFeeMatcher.canEnterPool(transaction)) {
                        await this.pool.addTransaction(transaction);
                        this.accept.push(transaction.id);
                        if (await this.dynamicFeeMatcher.canBroadcast(transaction)) {
                            broadcastable.push(transaction);
                        }
                    } else {
                        throw new TransactionFeeToLowError(transaction);
                    }
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

                        this.logger.warning(error.message);
                    } else {
                        throw error;
                    }
                }
            }
        } finally {
            if (broadcastable.length !== 0) {
                await this.networkMonitor.broadcastTransactions(broadcastable);
                for (const transaction of broadcastable) {
                    AppUtils.assert.defined<string>(transaction.id);
                    this.broadcast.push(transaction.id);
                }
            }
        }
    }
}
