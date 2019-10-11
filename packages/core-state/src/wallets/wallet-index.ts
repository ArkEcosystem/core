import { Contracts } from "@arkecosystem/core-kernel";

export class WalletIndex implements Contracts.State.WalletIndex {
    private walletIndex: Record<string, Contracts.State.Wallet>;

    public constructor(public readonly indexer: State.WalletIndexer) {
        this.walletIndex = {};
    }

    public entries(): ReadonlyArray<[string, State.IWallet]> {
        return Object.entries(this.walletIndex);
    }

    public keys(): string[] {
        return Object.keys(this.walletIndex);
    }

    public values(): ReadonlyArray<State.IWallet> {
        return Object.values(this.walletIndex);
    }

    public index(wallet: Contracts.State.Wallet): void {
        this.indexer(this, wallet);
    }

    public has(key: string): boolean {
        return !!this.walletIndex[key];
    }

    public get(key: string): Contracts.State.Wallet | undefined {
        return this.walletIndex[key];
    }

    public set(key: string, wallet: Contracts.State.Wallet): void {
        this.walletIndex[key] = wallet;
    }

    public forget(key: string): void {
        delete this.walletIndex[key];
    }

    public clear(): void {
        this.walletIndex = {};
    }
}
