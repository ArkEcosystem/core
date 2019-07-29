import { State } from "@arkecosystem/core-interfaces";
import cloneDeep from "lodash.clonedeep";
import { WalletManager } from "./wallet-manager";

export class TempWalletManager extends WalletManager {
    public constructor(private walletManager: State.IWalletManager) {
        super();

        this.index(this.walletManager.allByUsername());
    }

    public reindex(wallet: State.IWallet): void {
        super.reindex(cloneDeep(wallet));
    }

    public findByAddress(address: string): State.IWallet {
        return this.findClone(State.WalletIndexes.Addresses, address);
    }

    public findByPublicKey(publicKey: string): State.IWallet {
        return this.findClone(State.WalletIndexes.PublicKeys, publicKey);
    }

    public findByUsername(username: string): State.IWallet {
        return this.findClone(State.WalletIndexes.Usernames, username);
    }

    public hasByAddress(address: string): boolean {
        return this.walletManager.hasByAddress(address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.walletManager.hasByPublicKey(publicKey);
    }

    public hasByUsername(username: string): boolean {
        return this.walletManager.hasByUsername(username);
    }

    private findClone(indexName: string, key: string): State.IWallet {
        const index: State.IWalletIndex = this.getIndex(indexName);
        if (!index.has(key)) {
            const parentIndex: State.IWalletIndex = this.walletManager.getIndex(indexName);
            index.set(key, cloneDeep(parentIndex.get(key)));
        }

        return index.get(key);
    }
}
