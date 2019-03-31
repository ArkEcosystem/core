import { TransactionPool } from "./connection";
import { ConnectionFactory } from "./factory";

export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, TransactionPool> = new Map<string, TransactionPool>();

    public connection(name = "default"): TransactionPool {
        return this.connections.get(name);
    }

    public async createConnection(connection: TransactionPool, name = "default"): Promise<TransactionPool> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
