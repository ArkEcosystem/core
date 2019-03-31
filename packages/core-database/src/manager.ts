import { Database } from "@arkecosystem/core-interfaces";
import { ConnectionFactory } from "./factory";

export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, Database.IDatabaseConnection> = new Map<
        string,
        Database.IDatabaseConnection
    >();

    public connection(name = "default"): Database.IDatabaseConnection {
        return this.connections.get(name);
    }

    public async createConnection(
        connection: Database.IDatabaseConnection,
        name = "default",
    ): Promise<Database.IDatabaseConnection> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
