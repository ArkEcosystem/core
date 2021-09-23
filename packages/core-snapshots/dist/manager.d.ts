import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Database } from "./db";
export declare class SnapshotManager {
    readonly options: any;
    database: Database;
    constructor(options: any);
    make(connection: PostgresConnection): Promise<this>;
    dump(options: any): Promise<void>;
    import(options: any): Promise<void>;
    verify(options: any): Promise<void>;
    truncate(): Promise<void>;
    rollbackByHeight(height: number, backupTransactions?: boolean): Promise<void>;
    rollbackByNumber(amount: number, backupTransactions?: boolean): Promise<void>;
    private init;
}
