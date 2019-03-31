import { TransactionPool } from "./connection";

export class ConnectionFactory {
    public async make(connection: TransactionPool): Promise<TransactionPool> {
        return connection.make();
    }
}
