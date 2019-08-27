import { Contracts } from "@arkecosystem/core-kernel";

export class ConnectionFactory {
    public async make(connection: Contracts.Database.Connection): Promise<Contracts.Database.Connection> {
        return connection.make();
    }
}
