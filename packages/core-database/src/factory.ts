import { Database } from "@arkecosystem/core-interfaces";

export class ConnectionFactory {
    public async make(connection: Database.IConnection): Promise<Database.IConnection> {
        return connection.make();
    }
}
