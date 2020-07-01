// import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Contracts } from "@arkecosystem/core-kernel";

export class WalletIndex implements Contracts.State.WalletIndex {
    private walletIndex: Record<string, Contracts.State.Wallet>;

    public constructor(public readonly indexer: Contracts.State.WalletIndexer) {
        this.walletIndex = {};
    }

    public entries(): ReadonlyArray<[string, Contracts.State.Wallet]> {
        return Object.entries(this.walletIndex);
    }

    public keys(): string[] {
        return Object.keys(this.walletIndex);
    }

    public values(): ReadonlyArray<Contracts.State.Wallet> {
        return Object.values(this.walletIndex);
    }

    public index(wallet: Contracts.State.Wallet): void {
        for (const [key, indexedWallet] of Object.entries(this.walletIndex)) {
            if (indexedWallet === wallet) {
                delete this.walletIndex[key];
            }
        }
        this.indexer(this, wallet);
    }

    public has(key: string): boolean {
        return !!this.walletIndex[key];
    }

    public get(key: string): Contracts.State.Wallet {
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

    public clone(): Contracts.State.WalletIndex {
        const walletIndex = new WalletIndex(this.indexer);

        for (const [key, value] of Object.entries(this.walletIndex)) {
            walletIndex.set(key, value.clone());
        }

        return walletIndex;
    }
}
