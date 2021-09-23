import { TransactionPool } from "@arkecosystem/core-interfaces";
export declare class ConnectionManager {
    private readonly factory;
    private readonly connections;
    connection(name?: string): TransactionPool.IConnection;
    createConnection(connection: TransactionPool.IConnection, name?: string): Promise<TransactionPool.IConnection>;
}
