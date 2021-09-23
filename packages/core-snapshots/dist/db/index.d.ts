import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Shared } from "@arkecosystem/core-interfaces";
export declare class Database {
    db: any;
    pgp: any;
    blocksColumnSet: any;
    transactionsColumnSet: any;
    roundsColumnSet: any;
    make(connection: PostgresConnection): Promise<this>;
    close(): void;
    getLastBlock(): Promise<any>;
    /**
     * Get the highest row from the rounds table.
     * @return Object latest row
     * @return null if the table is empty.
     */
    getLastRound(): Promise<{
        public_key: string;
        balance: string;
        round: string;
    } | null>;
    getBlockByHeight(height: any): Promise<any>;
    truncate(): Promise<void>;
    rollbackChain(roundInfo: Shared.IRoundInfo): Promise<any>;
    getExportQueries(meta: {
        startHeight: number;
        endHeight: number;
        skipCompression: boolean;
        folder: string;
    }): Promise<{
        blocks: any;
        transactions: any;
        rounds: any;
    }>;
    getTransactionsBackupQuery(startTimestamp: any): any;
    getColumnSet(tableName: any): any;
    private createColumnSets;
}
export declare const database: Database;
