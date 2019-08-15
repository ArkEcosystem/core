import { Contracts } from "@arkecosystem/core-kernel";

export class WalletIndex implements Contracts.State.IWalletIndex {
    private walletIndex: Record<string, Contracts.State.IWallet>;

    public constructor(private readonly indexer: Contracts.State.WalletIndexer) {
        this.walletIndex = {};
    }

    public all(): ReadonlyArray<Contracts.State.IWallet> {
        return Object.values(this.walletIndex);
    }

    public index(wallet: Contracts.State.IWallet): void {
        this.indexer(this, wallet);
    }

    public has(key: string): boolean {
        return !!this.walletIndex[key];
    }

    public get(key: string): Contracts.State.IWallet | undefined {
        return this.walletIndex[key];
    }

    public set(key: string, wallet: Contracts.State.IWallet): void {
        this.walletIndex[key] = wallet;
    }

    public forget(key: string): void {
        delete this.walletIndex[key];
    }

    public clear(): void {
        this.walletIndex = {};
    }
}
