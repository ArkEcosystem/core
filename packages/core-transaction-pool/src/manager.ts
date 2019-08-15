import { Contracts } from "@arkecosystem/core-kernel";
import { ConnectionFactory } from "./factory";

export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, Contracts.TransactionPool.IConnection> = new Map<
        string,
        Contracts.TransactionPool.IConnection
    >();

    public connection(name: string = "default"): Contracts.TransactionPool.IConnection {
        return this.connections.get(name);
    }

    public async createConnection(
        connection: Contracts.TransactionPool.IConnection,
        name: string = "default",
    ): Promise<Contracts.TransactionPool.IConnection> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
