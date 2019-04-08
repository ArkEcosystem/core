import { models, Transaction } from "@arkecosystem/crypto";
import { EventEmitter, Logger } from "../index";
import {
    IBlocksBusinessRepository,
    IDelegatesBusinessRepository,
    ITransactionsBusinessRepository,
    IWalletsBusinessRepository,
} from "./business-repository";
import { IConnection } from "./database-connection";
import { IDelegateWallet, IWalletManager } from "./wallet-manager";

export interface IDatabaseService {
    walletManager: IWalletManager;

    wallets: IWalletsBusinessRepository;

    delegates: IDelegatesBusinessRepository;

    blocksBusinessRepository: IBlocksBusinessRepository;

    transactionsBusinessRepository: ITransactionsBusinessRepository;

    connection: IConnection;

    logger: Logger.ILogger;

    emitter: EventEmitter.EventEmitter;

    config: any;

    options: any;

    cache: Map<any, any>;

    restoredDatabaseIntegrity: boolean;

    verifyBlockchain(): Promise<{ valid: boolean; errors: any[] }>;

    getActiveDelegates(height: number, delegates?: IDelegateWallet[]): Promise<IDelegateWallet[]>;

    restoreCurrentRound(height: number): Promise<void>;

    buildWallets(): Promise<boolean>;

    saveBlock(block: models.Block): Promise<void>;

    // TODO: These methods are exposing database terminology on the business layer, not a fan...

    enqueueDeleteBlock(block: models.Block): void;

    enqueueDeleteRound(height: number): void;

    commitQueuedQueries(): Promise<void>;

    deleteBlock(block: models.Block): Promise<void>;

    getBlock(id: string): Promise<models.Block>;

    getLastBlock(): Promise<models.Block>;

    getBlocks(offset: number, limit: number): Promise<any[]>;

    /**
     * Get the blocks at the given heights.
     * The transactions for those blocks will not be loaded like in `getBlocks()`.
     * @param {Array} heights array of arbitrary block heights
     * @return {Array} array for the corresponding blocks. The element (block) at index `i`
     * in the resulting array corresponds to the requested height at index `i` in the input
     * array heights[]. For example, if
     * heights[0] = 100
     * heights[1] = 200
     * heights[2] = 150
     * then the result array will have the same number of elements (3) and will be:
     * result[0] = block at height 100
     * result[1] = block at height 200
     * result[2] = block at height 150
     * If some of the requested blocks do not exist in our chain (requested height is larger than
     * the height of our blockchain), then that element will be `undefined` in the resulting array
     * @throws Error
     */
    getBlocksByHeight(heights: number[]): Promise<any[]>;

    getTopBlocks(count: number): Promise<any[]>;

    getRecentBlockIds(): Promise<string[]>;

    saveRound(activeDelegates: IDelegateWallet[]): Promise<void>;

    deleteRound(round: number): Promise<void>;

    getTransaction(id: string): Promise<any>;

    getForgedTransactionsIds(ids: string[]): Promise<any[]>;

    init(): Promise<void>;

    reset(): Promise<void>;

    loadBlocksFromCurrentRound(): Promise<void>;

    loadTransactionsForBlocks(blocks): Promise<void>;

    updateDelegateStats(delegates: any[]): void;

    applyRound(height: number): Promise<void>;

    revertRound(height: number): Promise<void>;

    applyBlock(block: models.Block): Promise<boolean>;

    revertBlock(block: models.Block): Promise<void>;

    verifyTransaction(transaction: Transaction): Promise<boolean>;

    getBlocksForRound(round?: number): Promise<models.Block[]>;

    getCommonBlocks(ids: string[]): Promise<models.IBlockData[]>;
}
