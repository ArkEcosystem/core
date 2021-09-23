import { Database } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
export declare class TransactionReader {
    private connection;
    private type;
    private typeGroup;
    static create(connection: Database.IConnection, typeConstructor: Transactions.TransactionConstructor): Promise<TransactionReader>;
    bufferSize: number;
    private index;
    private count;
    private constructor();
    hasNext(): boolean;
    read(): Promise<Database.IBootstrapTransaction[]>;
    private init;
}
