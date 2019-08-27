import { Contracts } from "@arkecosystem/core-kernel";

export class WalletIndex implements Contracts.State.WalletIndex {
    private walletIndex: Record<string, Contracts.State.Wallet>;

    public constructor(private readonly indexer: Contracts.State.WalletIndexer) {
        this.walletIndex = {};
    }

    public all(): ReadonlyArray<Contracts.State.Wallet> {
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
