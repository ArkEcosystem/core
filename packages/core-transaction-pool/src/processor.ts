import ByteBuffer from "bytebuffer";
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

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async process(data: Interfaces.ITransactionData[] | Buffer[]): Promise<{
        accept: string[],
        broadcast: string[],
        invalid: string[],
        excess: string[],
        errors?: { [id: string]: Contracts.TransactionPool.ProcessorError },
    }> {
        const accept: string[] = [];
        const broadcast: string[] = [];
        const invalid: string[] = [];
        const excess: string[] = [];
        let errors: { [id: string]: Contracts.TransactionPool.ProcessorError } | undefined = undefined;

        const broadcastableTransactions: Interfaces.ITransaction[] = [];

        try {
            for (let i = 0; i < data.length; i++) {
                const transactionData = data[i];

                try {
                    const transaction = transactionData instanceof Buffer
                        ? await this.getTransactionFromBuffer(transactionData)
                        : await this.getTransactionFromData(transactionData as Interfaces.ITransactionData);
                    await this.pool.addTransaction(transaction);
                    accept.push(transactionData instanceof Buffer ? `${i}` : transactionData.id ?? `${i}`);

                    try {
                        await this.dynamicFeeMatcher.throwIfCannotBroadcast(transaction);
                        broadcastableTransactions.push(transaction);
                    } catch {}
                } catch (error) {
                    invalid.push(transactionData instanceof Buffer ? `${i}` : transactionData.id ?? `${i}`);

                    if (error instanceof Contracts.TransactionPool.PoolError) {
                        if (error.type === "ERR_EXCEEDS_MAX_COUNT") {
                            excess.push(transactionData instanceof Buffer ? `${i}` : transactionData.id ?? `${i}`);
                        }

                        if (!errors) errors = {};
                        errors[transactionData instanceof Buffer ? i : transactionData.id ?? i] = {
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
                this.transactionBroadcaster.broadcastTransactions(broadcastableTransactions).catch(
                    (error) => this.logger.error(error.stack)
                );
                for (const transaction of broadcastableTransactions) {
                    AppUtils.assert.defined<string>(transaction.id);
                    broadcast.push(transaction.id);
                }
            }
        }

        return {
            accept,
            broadcast,
            invalid,
            excess,
            errors,
        };
    }

    private async getTransactionFromBuffer(
        transactionData: Buffer,
    ): Promise<Interfaces.ITransaction> {
        try {
            const transactionCommon = {} as Interfaces.ITransactionData;
            const txByteBuffer = ByteBuffer.wrap(transactionData);
            Transactions.Deserializer.deserializeCommon(transactionCommon, txByteBuffer);

            if (this.workerPool.isTypeGroupSupported(transactionCommon.typeGroup!)) {
                return await this.workerPool.getTransactionFromData(transactionData);
            } else {
                return Transactions.TransactionFactory.fromBytes(transactionData);
            }
        } catch (error) {
            throw new InvalidTransactionDataError(error.message);
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
