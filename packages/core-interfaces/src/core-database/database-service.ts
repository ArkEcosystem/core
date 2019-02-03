import { models } from "@arkecosystem/crypto";
import { EventEmitter, Logger } from "../index";
import { IDelegatesBusinessRepository, IWalletsBusinessRepository } from "./business-repository";
import { IDatabaseConnection } from "./database-connection";
import { IWalletManager } from "./wallet-manager";

export interface IDatabaseService {

    walletManager: IWalletManager;

    wallets: IWalletsBusinessRepository;

    delegates: IDelegatesBusinessRepository;

    connection: IDatabaseConnection;

    logger: Logger.ILogger;

    emitter: EventEmitter.EventEmitter;

    config: any;

    options: any;

    cache: Map<any, any>;

    restoredDatabaseIntegrity: boolean;

    verifyBlockchain(): Promise<{ valid: boolean, errors: any[] }>;

    getActiveDelegates(height: number, delegates?: any[]): Promise<any[]>;

    buildWallets(height: number): Promise<boolean>;

    saveWallets(force: boolean): Promise<void>;

    saveBlock(block: models.Block): Promise<void>;

    // TODO: These methods are exposing database terminology on the business layer, not a fan...

    enqueueSaveBlock(block: models.Block): void;

    enqueueDeleteBlock(block: models.Block): void;

    enqueueDeleteRound(height: number): void;

    commitQueuedQueries(): Promise<void>;

    deleteBlock(block: models.Block): Promise<void>;

    getBlock(id: string): Promise<models.Block>;

    getLastBlock(): Promise<models.Block>;

    getBlocks(offset: number, limit: number): Promise<any[]>;

    getTopBlocks(count): Promise<any[]>;

    getRecentBlockIds(): Promise<string[]>;

    saveRound(activeDelegates: object[]): Promise<void>;

    deleteRound(round: any): Promise<void>;

    getTransaction(id: string): Promise<any>;

    getForgedTransactionsIds(ids: string[]): Promise<any[]>;

    init(): Promise<void>;

    loadBlocksFromCurrentRound(): Promise<void>;

    loadTransactionsForBlocks(blocks): Promise<void>;

    updateDelegateStats(delegates: any[]): void;

    applyRound(height: number): Promise<void>;

    revertRound(height: number): Promise<void>;

    applyBlock(block: models.Block): Promise<boolean>;

    revertBlock(block: models.Block): Promise<void>;

    verifyTransaction(transaction: models.Transaction): Promise<boolean>;

    getBlocksForRound(round?: number): Promise<models.Block[]>;

    getCommonBlocks(ids: string[]): Promise<any[]>;
}
