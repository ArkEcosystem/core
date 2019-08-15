import { Contracts } from "@arkecosystem/core-kernel";
import cloneDeep from "lodash.clonedeep";
import { WalletManager } from "./wallet-manager";

export class TempWalletManager extends WalletManager {
    public constructor(private walletManager: Contracts.State.IWalletManager) {
        super();

        this.index(this.walletManager.allByUsername());
    }

    public reindex(wallet: Contracts.State.IWallet): void {
        super.reindex(cloneDeep(wallet));
    }

    public findByAddress(address: string): Contracts.State.IWallet {
        return this.findClone(Contracts.State.WalletIndexes.Addresses, address);
    }

    public findByPublicKey(publicKey: string): Contracts.State.IWallet {
        return this.findClone(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public findByUsername(username: string): Contracts.State.IWallet {
        return this.findClone(Contracts.State.WalletIndexes.Usernames, username);
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

    private findClone(indexName: string, key: string): Contracts.State.IWallet {
        const index: Contracts.State.IWalletIndex = this.getIndex(indexName);
        if (!index.has(key)) {
            const parentIndex: Contracts.State.IWalletIndex = this.walletManager.getIndex(indexName);
            index.set(key, cloneDeep(parentIndex.get(key)));
        }

        return index.get(key);
    }
}
