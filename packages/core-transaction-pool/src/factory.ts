import { Contracts } from "@arkecosystem/core-kernel";

export class ConnectionFactory {
    public async make(connection: Contracts.TransactionPool.Connection): Promise<Contracts.TransactionPool.Connection> {
        return connection.make();
    }
}
