import { Database } from "@arkecosystem/core-interfaces";
import { ConnectionFactory } from "./factory";

export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, Database.IConnection> = new Map<string, Database.IConnection>();

    public connection(name = "default"): Database.IConnection {
        return this.connections.get(name);
    }

    public async createConnection(connection: Database.IConnection, name = "default"): Promise<Database.IConnection> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
