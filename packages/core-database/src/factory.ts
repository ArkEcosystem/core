import { Contracts } from "@arkecosystem/core-kernel";

export class ConnectionFactory {
    public async make(connection: Contracts.Database.IConnection): Promise<Contracts.Database.IConnection> {
        return connection.make();
    }
}
