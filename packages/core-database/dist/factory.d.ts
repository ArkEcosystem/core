import { Database } from "@arkecosystem/core-interfaces";
export declare class ConnectionFactory {
    make(connection: Database.IConnection): Promise<Database.IConnection>;
}
