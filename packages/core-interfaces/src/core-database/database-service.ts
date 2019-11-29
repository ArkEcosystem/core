import { Interfaces } from "@arkecosystem/crypto";
import { IWallet, IWalletManager } from "../core-state/wallets";
import { EventEmitter, Logger } from "../index";
import { IRoundInfo } from "../shared";
import {
    IBlocksBusinessRepository,
    ITransactionsBusinessRepository,
    IWalletsBusinessRepository,
} from "./business-repository";
import { IConnection } from "./database-connection";

export interface IDownloadBlock extends Omit<Interfaces.IBlockData, "transactions"> {
    transactions: string[];
}

export interface IDatabaseService {
    walletManager: IWalletManager;

    wallets: IWalletsBusinessRepository;

    blocksBusinessRepository: IBlocksBusinessRepository;

    transactionsBusinessRepository: ITransactionsBusinessRepository;

    connection: IConnection;

    logger: Logger.ILogger;

    emitter: EventEmitter.EventEmitter;

    config: any;

    options: any;

    cache: Map<any, any>;

    restoredDatabaseIntegrity: boolean;

    verifyBlockchain(): Promise<boolean>;

    getActiveDelegates(roundInfo?: IRoundInfo, delegates?: IWallet[]): Promise<IWallet[]>;

    restoreCurrentRound(height: number): Promise<void>;

    buildWallets(): Promise<void>;

    saveBlock(block: Interfaces.IBlock): Promise<void>;

    saveBlocks(blocks: Interfaces.IBlock[]): Promise<void>;

    // TODO: These methods are exposing database terminology on the business layer, not a fan...

    deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void>;

    getBlock(id: string): Promise<Interfaces.IBlock>;

    getLastBlock(): Promise<Interfaces.IBlock>;

    getBlocks(offset: number, limit: number, headersOnly?: boolean): Promise<Interfaces.IBlockData[]>;

    getBlocksForDownload(offset: number, limit: number, headersOnly?: boolean): Promise<IDownloadBlock[]>;

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
    getBlocksByHeight(heights: number[]): Promise<Interfaces.IBlockData[]>;

    getTopBlocks(count: number): Promise<Interfaces.IBlockData[]>;

    getRecentBlockIds(): Promise<string[]>;

    saveRound(activeDelegates: IWallet[]): Promise<void>;

    deleteRound(round: number): Promise<void>;

    getTransaction(id: string): Promise<any>;

    getForgedTransactionsIds(ids: string[]): Promise<any[]>;

    init(): Promise<void>;

    reset(): Promise<void>;

    loadBlocksFromCurrentRound(): Promise<void>;

    applyRound(height: number): Promise<void>;

    revertRound(height: number): Promise<void>;

    applyBlock(block: Interfaces.IBlock): Promise<void>;

    revertBlock(block: Interfaces.IBlock): Promise<void>;

    verifyTransaction(transaction: Interfaces.ITransaction): Promise<boolean>;

    getBlocksForRound(roundInfo?: IRoundInfo): Promise<Interfaces.IBlock[]>;

    getCommonBlocks(ids: string[]): Promise<Interfaces.IBlockData[]>;
}
