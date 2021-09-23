import { DatabaseService } from "@arkecosystem/core-database";
import { State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
export declare class MemoryDatabaseService extends DatabaseService {
    walletManager: State.IWalletManager;
    constructor(walletManager: State.IWalletManager);
    saveBlocks(blocks: Interfaces.IBlock[]): Promise<void>;
    saveRound(activeDelegates: State.IWallet[]): Promise<void>;
    deleteRound(round: number): Promise<void>;
    getForgedTransactionsIds(ids: string[]): Promise<any[]>;
    getBlock(id: string): Promise<Interfaces.IBlock>;
}
