import { Database } from "@arkecosystem/core-interfaces";

export class ConnectionFactory {
    public async make(connection: Database.IDatabaseConnection): Promise<Database.IDatabaseConnection> {
        return connection.make();
    }
}
