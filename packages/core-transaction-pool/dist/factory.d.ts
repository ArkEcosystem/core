import { TransactionPool } from "@arkecosystem/core-interfaces";
export declare class ConnectionFactory {
    make(connection: TransactionPool.IConnection): Promise<TransactionPool.IConnection>;
}
