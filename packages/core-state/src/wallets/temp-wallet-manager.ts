import { State } from "@arkecosystem/core-interfaces";
import { Identities } from "@arkecosystem/crypto";
import cloneDeep from "lodash.clonedeep";
import { WalletManager } from "./wallet-manager";

export class TempWalletManager extends WalletManager {
    public constructor(private walletManager: State.IWalletManager) {
        super();

        this.index(this.walletManager.allByUsername());

        for (const index of walletManager.getIndexNames()) {
            if (this.indexes[index]) {
                continue;
            }

            this.indexes[index] = cloneDeep(walletManager.getIndex(index));
        }
    }

    public reindex(wallet: State.IWallet): void {
        super.reindex(cloneDeep(wallet));
    }

    public findByAddress(address: string): State.IWallet {
        return this.findByIndex(State.WalletIndexes.Addresses, address);
    }

    public findByPublicKey(publicKey: string): State.IWallet {
        // Sender wallet may not be indexed yet by public key
        if (!this.walletManager.hasByPublicKey(publicKey)) {
            const wallet: State.IWallet = this.findByAddress(Identities.Address.fromPublicKey(publicKey));
            wallet.publicKey = publicKey;
            this.reindex(wallet);

            return wallet;
        }

        return this.findByIndex(State.WalletIndexes.PublicKeys, publicKey);
    }

    public findByUsername(username: string): State.IWallet {
        return this.findByIndex(State.WalletIndexes.Usernames, username);
    }

    public findByIndex(indexName: string, key: string): State.IWallet {
        const index: State.IWalletIndex = this.getIndex(indexName);
        if (!index.has(key)) {
            const parentIndex: State.IWalletIndex = this.walletManager.getIndex(indexName);
            index.set(key, cloneDeep(parentIndex.get(key)));
        }

        return index.get(key);
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
}
