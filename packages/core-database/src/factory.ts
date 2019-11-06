import { Contracts } from "@arkecosystem/core-kernel";

export class ConnectionFactory {
    public async make(connection: Contracts.Database.Connection): Promise<Contracts.Database.Connection> {
        // @ts-ignore - this is bricked because the db packages are not adjusted to IoC
        return connection.make();
    }
}
