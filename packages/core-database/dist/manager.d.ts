import { Database } from "@arkecosystem/core-interfaces";
export declare class ConnectionManager {
    private readonly factory;
    private readonly connections;
    connection(name?: string): Database.IConnection;
    createConnection(connection: Database.IConnection, name?: string): Promise<Database.IConnection>;
}
