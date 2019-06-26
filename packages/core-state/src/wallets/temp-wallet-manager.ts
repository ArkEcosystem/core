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
        if (!this.byAddress[address]) {
            this.byAddress[address] = cloneDeep(this.walletManager.findByAddress(address));
        }

        return this.byAddress[address];
    }

    public findByPublicKey(publicKey: string): State.IWallet {
        if (!this.byPublicKey[publicKey]) {
            this.byPublicKey[publicKey] = cloneDeep(this.walletManager.findByPublicKey(publicKey));
        }

        return this.byPublicKey[publicKey];
    }

    public findByUsername(username: string): State.IWallet {
        if (!this.byUsername[username]) {
            this.byUsername[username] = cloneDeep(this.walletManager.findByUsername(username));
        }

        return this.byUsername[username];
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
