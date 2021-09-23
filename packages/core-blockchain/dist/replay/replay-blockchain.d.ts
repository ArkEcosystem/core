import { Database, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { Blockchain } from "../blockchain";
export declare class ReplayBlockchain extends Blockchain {
    private logger;
    private localDatabase;
    private walletManager;
    private targetHeight;
    private chunkSize;
    private memoryDatabase;
    get database(): Database.IDatabaseService;
    constructor();
    get p2p(): P2P.IPeerService;
    get transactionPool(): TransactionPool.IConnection;
    resetLastDownloadedBlock(): void;
    resetWakeUp(): void;
    replay(targetHeight?: number): Promise<void>;
    private fetchBatch;
    private processGenesisBlock;
    private disconnect;
}
