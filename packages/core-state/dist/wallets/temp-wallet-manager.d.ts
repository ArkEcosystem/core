import { State } from "@arkecosystem/core-interfaces";
import { WalletManager } from "./wallet-manager";
export declare class TempWalletManager extends WalletManager {
    private walletManager;
    constructor(walletManager: State.IWalletManager);
    reindex(wallet: State.IWallet): void;
    findByAddress(address: string): State.IWallet;
    findByUsername(username: string): State.IWallet;
    findByIndex(indexName: string, key: string): State.IWallet;
    hasByAddress(address: string): boolean;
    hasByPublicKey(publicKey: string): boolean;
    hasByUsername(username: string): boolean;
}
