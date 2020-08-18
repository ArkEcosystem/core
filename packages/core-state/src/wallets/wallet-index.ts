import { Contracts } from "@arkecosystem/core-kernel";

export class WalletIndex implements Contracts.State.WalletIndex {
    private walletByKey: Map<string, Contracts.State.Wallet>;
    private keysByWallet: Map<Contracts.State.Wallet, string[]>;

    public constructor(public readonly indexer: Contracts.State.WalletIndexer) {
        this.walletByKey = new Map<string, Contracts.State.Wallet>();
        this.keysByWallet = new Map<Contracts.State.Wallet, string[]>();
    }

    public entries(): ReadonlyArray<[string, Contracts.State.Wallet]> {
        return [...this.walletByKey.entries()];
    }

    public keys(): string[] {
        return [...this.walletByKey.keys()];
    }

    public values(): ReadonlyArray<Contracts.State.Wallet> {
        return [...this.walletByKey.values()];
    }

    public index(wallet: Contracts.State.Wallet): void {
        this.indexer(this, wallet);
    }

    public has(key: string): boolean {
        return this.walletByKey.has(key);
    }

    public get(key: string): Contracts.State.Wallet {
        return this.walletByKey.get(key) as Contracts.State.Wallet;
    }

    public set(key: string, wallet: Contracts.State.Wallet): void {
        // Key already exists
        if (this.walletByKey.has(key)) {
            const existingWallet = this.walletByKey.get(key)!;

            // Remove given key in case where key points to different wallet
            const existingKeys = this.keysByWallet.get(existingWallet)!;
            this.keysByWallet.set(existingWallet, [...existingKeys.filter((x) => x !== key)]);
        }

        this.walletByKey.set(key, wallet);

        if (this.keysByWallet.has(wallet)) {
            const existingKeys = this.keysByWallet.get(wallet)!;
            this.keysByWallet.set(wallet, [...existingKeys, key]);
        } else {
            this.keysByWallet.set(wallet, [key]);
        }
    }

    public forget(key: string): void {
        if (this.walletByKey.has(key)) {
            const wallet = this.walletByKey.get(key)!;

            const keys = this.keysByWallet.get(wallet)!;

            this.keysByWallet.set(
                wallet,
                keys.filter((x) => x !== key),
            );

            this.walletByKey.delete(key);
        }
    }

    public forgetWallet(wallet: Contracts.State.Wallet): void {
        if (this.keysByWallet.has(wallet)) {
            const keys = this.keysByWallet.get(wallet)!;

            for (const key of keys) {
                this.walletByKey.delete(key);
            }

            this.keysByWallet.delete(wallet);
        }
    }

    public clear(): void {
        this.walletByKey = new Map<string, Contracts.State.Wallet>();
    }

    public clone(): Contracts.State.WalletIndex {
        const walletIndex = new WalletIndex(this.indexer);

        for (const [key, value] of this.entries()) {
            walletIndex.set(key, value.clone());
        }

        return walletIndex;
    }
}
