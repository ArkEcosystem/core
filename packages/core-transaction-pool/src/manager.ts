import { TransactionPool } from "@arkecosystem/core-interfaces";
import { ConnectionFactory } from "./factory";

export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, TransactionPool.IConnection> = new Map<
        string,
        TransactionPool.IConnection
    >();

    public connection(name: string = "default"): TransactionPool.IConnection {
        return this.connections.get(name);
    }

    public async createConnection(
        connection: TransactionPool.IConnection,
        name: string = "default",
    ): Promise<TransactionPool.IConnection> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
