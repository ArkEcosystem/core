import { Contracts, IoC } from "@arkecosystem/core-kernel";
import { ConnectionFactory } from "./factory";

@IoC.injectable()
export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, Contracts.Database.IConnection> = new Map<
        string,
        Contracts.Database.IConnection
    >();

    public connection(name = "default"): Contracts.Database.IConnection {
        return this.connections.get(name);
    }

    public async createConnection(
        connection: Contracts.Database.IConnection,
        name = "default",
    ): Promise<Contracts.Database.IConnection> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
