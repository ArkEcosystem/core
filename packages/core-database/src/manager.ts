import { Container, Contracts } from "@arkecosystem/core-kernel";

import { ConnectionFactory } from "./factory";

@Container.injectable()
export class ConnectionManager {
    private readonly factory: ConnectionFactory = new ConnectionFactory();
    private readonly connections: Map<string, Contracts.Database.Connection> = new Map<
        string,
        Contracts.Database.Connection
    >();

    public connection(name = "default"): Contracts.Database.Connection {
        return this.connections.get(name);
    }

    public async createConnection(
        connection: Contracts.Database.Connection,
        name = "default",
    ): Promise<Contracts.Database.Connection> {
        this.connections.set(name, await this.factory.make(connection));

        return this.connection(name);
    }
}
