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

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly pool!: Contracts.TransactionPool.Service;

    @Container.inject(Container.Identifiers.TransactionPoolDynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: Contracts.TransactionPool.DynamicFeeMatcher;

    @Container.inject(Container.Identifiers.PeerTransactionBroadcaster)
    @Container.optional()
    private readonly transactionBroadcaster!: Contracts.P2P.TransactionBroadcaster | undefined;

    public async process(data: Interfaces.ITransactionData[]): Promise<void> {
        const broadcastableTransactions: Interfaces.ITransaction[] = [];
        const transactions = data.map(d => Transactions.TransactionFactory.fromData(d));

        try {
            for (const transaction of transactions) {
                AppUtils.assert.defined<string>(transaction.id);

                try {
                    if (await this.dynamicFeeMatcher.canEnterPool(transaction)) {
                        await this.pool.addTransaction(transaction);
                        this.accept.push(transaction.id);
                        if (await this.dynamicFeeMatcher.canBroadcast(transaction)) {
                            broadcastableTransactions.push(transaction);
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
}
