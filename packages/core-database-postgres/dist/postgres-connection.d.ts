import { Database, State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { IMain } from "pg-promise";
import { Model } from "./models";
import { QueryExecutor } from "./sql/query-executor";
export declare class PostgresConnection implements Database.IConnection {
    readonly options: Record<string, any>;
    private readonly walletManager;
    models: {
        [key: string]: Model;
    };
    query: QueryExecutor;
    db: any;
    blocksRepository: Database.IBlocksRepository;
    roundsRepository: Database.IRoundsRepository;
    transactionsRepository: Database.ITransactionsRepository;
    walletsRepository: Database.IWalletsRepository;
    pgp: IMain;
    private readonly logger;
    private readonly emitter;
    private migrationsRepository;
    private cache;
    constructor(options: Record<string, any>, walletManager: State.IWalletManager);
    make(): Promise<Database.IConnection>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    buildWallets(): Promise<void>;
    deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void>;
    saveBlock(block: Interfaces.IBlock): Promise<void>;
    saveBlocks(blocks: Interfaces.IBlock[]): Promise<void>;
    resetAll(): Promise<void>;
    /**
     * Run all migrations.
     * @return {void}
     */
    private runMigrations;
    private migrateTransactionsTableToAssetColumn;
    private registerModels;
    private registerQueryExecutor;
    private exposeRepositories;
}
