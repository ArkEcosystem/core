import { Contracts } from "@arkecosystem/core-kernel";

// todo: review the implementation - is this really needed?
export class ConnectionFactory {
    public async make(connection: Contracts.TransactionPool.Connection): Promise<Contracts.TransactionPool.Connection> {
        return connection.make();
    }
}
