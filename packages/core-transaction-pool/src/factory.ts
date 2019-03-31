import { TransactionPool } from "@arkecosystem/core-interfaces";

export class ConnectionFactory {
    public async make(connection: TransactionPool.ITransactionPool): Promise<TransactionPool.ITransactionPool> {
        return connection.make();
    }
}
