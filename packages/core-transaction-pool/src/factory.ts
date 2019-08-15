import { Contracts } from "@arkecosystem/core-kernel";

export class ConnectionFactory {
    public async make(
        connection: Contracts.TransactionPool.IConnection,
    ): Promise<Contracts.TransactionPool.IConnection> {
        return connection.make();
    }
}
