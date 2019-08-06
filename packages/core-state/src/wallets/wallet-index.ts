import { State } from "@arkecosystem/core-interfaces";

export class WalletIndex implements State.IWalletIndex {
    private walletIndex: Record<string, State.IWallet>;

    public constructor(private readonly indexer: State.WalletIndexer) {
        this.walletIndex = {};
    }

    public all(): ReadonlyArray<State.IWallet> {
        return Object.values(this.walletIndex);
    }

    public index(wallet: State.IWallet): void {
        this.indexer(this, wallet);
    }

    public has(key: string): boolean {
        return !!this.walletIndex[key];
    }

    public get(key: string): State.IWallet | undefined {
        return this.walletIndex[key];
    }

    public set(key: string, wallet: State.IWallet): void {
        this.walletIndex[key] = wallet;
    }

    public forget(key: string): void {
        delete this.walletIndex[key];
    }

    public clear(): void {
        this.walletIndex = {};
    }
}
