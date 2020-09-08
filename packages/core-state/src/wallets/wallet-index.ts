import { Contracts } from "@arkecosystem/core-kernel";

export class WalletIndex implements Contracts.State.WalletIndex {
    private walletByKey: Map<string, Contracts.State.Wallet>;
    private keysByWallet: Map<Contracts.State.Wallet, Set<string>>;

    public constructor(public readonly indexer: Contracts.State.WalletIndexer, public readonly autoIndex: boolean) {
        this.walletByKey = new Map<string, Contracts.State.Wallet>();
        this.keysByWallet = new Map<Contracts.State.Wallet, Set<string>>();
    }

    public entries(): ReadonlyArray<[string, Contracts.State.Wallet]> {
        return [...this.walletByKey.entries()];
    }

    public keys(): string[] {
        return [...this.walletByKey.keys()];
    }

    public walletKeys(wallet: Contracts.State.Wallet): string[] {
        const walletKeys = this.keysByWallet.get(wallet);

        return walletKeys ? [...walletKeys.keys()] : [];
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
        const existingWallet = this.walletByKey.get(key)!;

        // Remove given key in case where key points to different wallet
        if (existingWallet) {
            const existingKeys = this.keysByWallet.get(existingWallet)!;
            existingKeys.delete(key);
        }

        this.walletByKey.set(key, wallet);

        if (this.keysByWallet.has(wallet)) {
            const existingKeys = this.keysByWallet.get(wallet)!;
            existingKeys.add(key);
        } else {
            const keys: Set<string> = new Set();
            keys.add(key);

            this.keysByWallet.set(wallet, keys);
        }
    }

    public forget(key: string): void {
        const wallet = this.walletByKey.get(key)!;

        if (wallet) {
            const existingKeys = this.keysByWallet.get(wallet)!;

            existingKeys.delete(key);

            this.walletByKey.delete(key);
        }
    }

    public forgetWallet(wallet: Contracts.State.Wallet): void {
        const keys = this.keysByWallet.get(wallet)!;

        if (keys) {
            for (const key of keys) {
                this.walletByKey.delete(key);
            }

            this.keysByWallet.delete(wallet);
        }
    }

    public clear(): void {
        this.walletByKey = new Map<string, Contracts.State.Wallet>();
        this.keysByWallet = new Map<Contracts.State.Wallet, Set<string>>();
    }
}
