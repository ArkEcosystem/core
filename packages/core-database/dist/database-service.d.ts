/// <reference types="node" />
import { Database, EventEmitter, Logger, Shared, State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
export declare class DatabaseService implements Database.IDatabaseService {
    connection: Database.IConnection;
    walletManager: State.IWalletManager;
    logger: Logger.ILogger;
    emitter: EventEmitter.EventEmitter;
    config: any;
    options: any;
    wallets: Database.IWalletsBusinessRepository;
    blocksBusinessRepository: Database.IBlocksBusinessRepository;
    transactionsBusinessRepository: Database.ITransactionsBusinessRepository;
    blocksInCurrentRound: Interfaces.IBlock[];
    restoredDatabaseIntegrity: boolean;
    forgingDelegates: State.IWallet[];
    cache: Map<any, any>;
    constructor(options: Record<string, any>, connection: Database.IConnection, walletManager: State.IWalletManager, walletsBusinessRepository: Database.IWalletsBusinessRepository, transactionsBusinessRepository: Database.ITransactionsBusinessRepository, blocksBusinessRepository: Database.IBlocksBusinessRepository);
    init(): Promise<void>;
    restoreCurrentRound(height: number): Promise<void>;
    reset(): Promise<void>;
    applyBlock(block: Interfaces.IBlock): Promise<void>;
    applyRound(height: number): Promise<void>;
    buildWallets(): Promise<void>;
    deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void>;
    deleteRound(round: number): Promise<void>;
    getActiveDelegates(roundInfo?: Shared.IRoundInfo, delegates?: State.IWallet[]): Promise<State.IWallet[]>;
    getBlock(id: string): Promise<Interfaces.IBlock | undefined>;
    getBlocks(offset: number, limit: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]>;
    getBlocksForDownload(offset: number, limit: number, headersOnly?: boolean): Promise<Database.IDownloadBlock[]>;
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
    getBlocksForRound(roundInfo?: Shared.IRoundInfo): Promise<Interfaces.IBlock[]>;
    getForgedTransactionsIds(ids: string[]): Promise<string[]>;
    getLastBlock(): Promise<Interfaces.IBlock>;
    getCommonBlocks(ids: string[]): Promise<Interfaces.IBlockData[]>;
    getRecentBlockIds(): Promise<string[]>;
    getTopBlocks(count: number): Promise<Interfaces.IBlockData[]>;
    getTransaction(id: string): Promise<Interfaces.ITransactionData>;
    loadBlocksFromCurrentRound(): Promise<void>;
    revertBlock(block: Interfaces.IBlock): Promise<void>;
    revertRound(height: number): Promise<void>;
    saveBlock(block: Interfaces.IBlock): Promise<void>;
    saveBlocks(blocks: Interfaces.IBlock[]): Promise<void>;
    saveRound(activeDelegates: State.IWallet[]): Promise<void>;
    verifyBlockchain(): Promise<boolean>;
    verifyTransaction(transaction: Interfaces.ITransaction): Promise<boolean>;
    private detectMissedBlocks;
    private initializeLastBlock;
    private loadTransactionsForBlocks;
    private getTransactionsForBlocks;
    private createGenesisBlock;
    private configureState;
    private detectMissedRound;
    private initializeActiveDelegates;
    private setForgingDelegatesOfRound;
    private calcPreviousActiveDelegates;
    private emitTransactionEvents;
}
