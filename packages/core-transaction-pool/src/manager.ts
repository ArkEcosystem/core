import { TransactionPool } from "@arkecosystem/core-interfaces";
import { ConnectionFactory } from "./factory";

export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, TransactionPool.ITransactionPool> = new Map<
        string,
        TransactionPool.ITransactionPool
    >();

    public connection(name = "default"): TransactionPool.ITransactionPool {
        return this.connections.get(name);
    }

    public async createConnection(
        connection: TransactionPool.ITransactionPool,
        name = "default",
    ): Promise<TransactionPool.ITransactionPool> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
