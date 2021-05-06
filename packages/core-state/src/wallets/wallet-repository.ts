import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "./errors";
import { WalletIndex } from "./wallet-index";

// todo: review the implementation
@Container.injectable()
export class WalletRepository implements Contracts.State.WalletRepository {
    @Container.multiInject(Container.Identifiers.WalletRepositoryIndexerIndex)
    protected readonly indexerIndexes!: Contracts.State.WalletIndexerIndex[];

    @Container.inject(Container.Identifiers.WalletFactory)
    private readonly createWalletFactory!: Contracts.State.WalletFactory;

    protected readonly indexes: Record<string, Contracts.State.WalletIndex> = {};

    @Container.postConstruct()
    public initialize(): void {
        for (const { name, indexer, autoIndex } of this.indexerIndexes) {
            if (this.indexes[name]) {
                throw new WalletIndexAlreadyRegisteredError(name);
            }
            this.indexes[name] = new WalletIndex(indexer, autoIndex);
        }
    }

    public createWallet(address: string): Contracts.State.Wallet {
        return this.createWalletFactory(address);
    }

    public getIndex(name: string): Contracts.State.WalletIndex {
        if (!this.indexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }
        return this.indexes[name];
    }

    public getIndexNames(): string[] {
        return Object.keys(this.indexes);
    }

    public allByAddress(): ReadonlyArray<Contracts.State.Wallet> {
        return this.getIndex(Contracts.State.WalletIndexes.Addresses).values();
    }

    public allByPublicKey(): ReadonlyArray<Contracts.State.Wallet> {
        return this.getIndex(Contracts.State.WalletIndexes.PublicKeys).values();
    }

    public allByUsername(): ReadonlyArray<Contracts.State.Wallet> {
        return this.getIndex(Contracts.State.WalletIndexes.Usernames).values();
    }

    public allByIndex(indexName: string): ReadonlyArray<Contracts.State.Wallet> {
        return this.getIndex(indexName).values();
    }

    public findByAddress(address: string): Contracts.State.Wallet {
        const index = this.getIndex(Contracts.State.WalletIndexes.Addresses);
        if (address && !index.has(address)) {
            index.set(address, this.createWallet(address));
        }
        const wallet: Contracts.State.Wallet | undefined = index.get(address);
        AppUtils.assert.defined<Contracts.State.Wallet>(wallet);
        return wallet;
    }

    public findByPublicKey(publicKey: string): Contracts.State.Wallet {
        const index = this.getIndex(Contracts.State.WalletIndexes.PublicKeys);
        if (publicKey && !index.has(publicKey)) {
            const wallet = this.findByAddress(Identities.Address.fromPublicKey(publicKey));
            wallet.setPublicKey(publicKey);
            index.set(publicKey, wallet);
        }
        const wallet: Contracts.State.Wallet | undefined = index.get(publicKey);
        AppUtils.assert.defined<Contracts.State.Wallet>(wallet);
        return wallet;
    }

    public findByUsername(username: string): Contracts.State.Wallet {
        return this.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public findByIndex(index: string, key: string): Contracts.State.Wallet {
        if (!this.hasByIndex(index, key)) {
            throw new Error(`Wallet ${key} doesn't exist in index ${index}`);
        }
        return this.getIndex(index).get(key)!;
    }

    public findByIndexes(indexes: string[], key: string): Contracts.State.Wallet {
        for (const index of indexes) {
            if (this.hasByIndex(index, key)) {
                return this.findByIndex(index, key);
            }
        }
        throw new Error(`Wallet ${key} doesn't exist in indexes ${indexes.join(", ")}`);
    }

    public has(key: string): boolean {
        return Object.values(this.indexes).some((index) => index.has(key));
    }

    public hasByAddress(address: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public hasByUsername(username: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public hasByIndex(indexName: string, key: string): boolean {
        return this.getIndex(indexName).has(key);
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.hasByPublicKey(publicKey)) {
            return this.findByPublicKey(publicKey).getNonce();
        }

        return Utils.BigNumber.ZERO;
    }

    public index(wallets: Contracts.State.Wallet | Contracts.State.Wallet[]): void {
        if (!Array.isArray(wallets)) {
            this.indexWallet(wallets);
        } else {
            for (const wallet of wallets) {
                this.indexWallet(wallet);
            }
        }
    }

    public setOnIndex(index: string, key: string, wallet: Contracts.State.Wallet): void {
        this.getIndex(index).set(key, wallet);
    }

    public forgetOnIndex(index: string, key: string): void {
        this.getIndex(index).forget(key);
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }

    public cloneWallet(
        origin: Contracts.State.WalletRepository,
        wallet: Contracts.State.Wallet,
    ): Contracts.State.Wallet {
        const walletClone = wallet.clone();

        for (const indexName of origin.getIndexNames()) {
            const walletKeys = origin.getIndex(indexName).walletKeys(wallet);

            const index = this.getIndex(indexName);
            for (const key of walletKeys) {
                index.set(key, walletClone);
            }
        }

        return walletClone;
    }

    protected indexWallet(wallet: Contracts.State.Wallet): void {
        for (const index of Object.values(this.indexes).filter((index) => index.autoIndex)) {
            index.forgetWallet(wallet);
            index.index(wallet);
        }
    }
}
