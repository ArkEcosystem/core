import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

import { WalletIndexNotFoundError } from "./errors";
import { WalletIndex } from "./wallet-index";
import { WalletRepository } from "./wallet-repository";

@Container.injectable()
export class WalletRepositoryClone extends WalletRepository {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly blockchainWalletRepository!: Contracts.State.WalletRepository;

    private readonly forgetIndexes: Record<string, Contracts.State.WalletIndex> = {};

    @Container.postConstruct()
    public initialize(): void {
        super.initialize();

        for (const { name, indexer, autoIndex } of this.indexerIndexes) {
            this.forgetIndexes[name] = new WalletIndex(indexer, autoIndex);
        }
    }

    public createWallet(address: string): Contracts.State.Wallet {
        return super.createWallet(address);
    }

    public allByAddress(): ReadonlyArray<Contracts.State.Wallet> {
        return this.allByIndex(Contracts.State.WalletIndexes.Addresses);
    }

    public allByPublicKey(): ReadonlyArray<Contracts.State.Wallet> {
        return this.allByIndex(Contracts.State.WalletIndexes.PublicKeys);
    }

    public allByUsername(): ReadonlyArray<Contracts.State.Wallet> {
        return this.allByIndex(Contracts.State.WalletIndexes.Usernames);
    }

    public allByIndex(indexName: string): ReadonlyArray<Contracts.State.Wallet> {
        this.cloneAllByIndex(indexName);
        return this.getIndex(indexName).values();
    }

    public findByAddress(address: string): Contracts.State.Wallet {
        if (super.hasByIndex(Contracts.State.WalletIndexes.Addresses, address)) {
            return super.findByIndex(Contracts.State.WalletIndexes.Addresses, address);
        }

        let wallet;
        if (this.blockchainWalletRepository.hasByAddress(address)) {
            const walletToClone = this.blockchainWalletRepository.findByAddress(address);
            wallet = this.cloneWallet(this.blockchainWalletRepository, walletToClone);
        } else {
            wallet = this.createWallet(address);
        }

        super.index(wallet);

        return wallet;
    }

    public findByPublicKey(publicKey: string): Contracts.State.Wallet {
        if (!super.hasByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey)) {
            const wallet = this.findByAddress(Identities.Address.fromPublicKey(publicKey));
            wallet.setPublicKey(publicKey);
            super.index(wallet);
        }

        return super.findByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public findByIndex(index: string, key: string): Contracts.State.Wallet {
        if (!super.hasByIndex(index, key)) {
            const walletToClone = this.blockchainWalletRepository.findByIndex(index, key);
            this.cloneWallet(this.blockchainWalletRepository, walletToClone);
        }

        return this.getIndex(index).get(key)!;
    }

    public has(key: string): boolean {
        for (const indexName of this.getIndexNames()) {
            if (this.hasByIndex(indexName, key)) {
                return true;
            }
        }

        return false;
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
        return (
            this.getIndex(indexName).has(key) ||
            (this.blockchainWalletRepository.getIndex(indexName).has(key) && !this.getForgetIndex(indexName).has(key))
        );
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)) {
            return this.findByPublicKey(publicKey).getNonce();
        }

        if (this.blockchainWalletRepository.hasByPublicKey(publicKey)) {
            return this.blockchainWalletRepository.findByPublicKey(publicKey).getNonce();
        }

        return Utils.BigNumber.ZERO;
    }

    public forgetOnIndex(index: string, key: string): void {
        if (this.getIndex(index).has(key) || this.blockchainWalletRepository.getIndex(index).has(key)) {
            const wallet = this.findByIndex(index, key);

            this.getIndex(index).forget(key);

            this.getForgetIndex(index).set(key, wallet);
        }
    }

    public reset(): void {
        super.reset();
        for (const walletIndex of Object.values(this.forgetIndexes)) {
            walletIndex.clear();
        }
    }

    protected indexWallet(wallet: Contracts.State.Wallet): void {
        const indexKeys = {};
        for (const indexName of this.getIndexNames()) {
            indexKeys[indexName] = this.getIndex(indexName).walletKeys(wallet);
        }

        super.indexWallet(wallet);

        for (const indexName of this.getIndexNames()) {
            const walletKeys = this.getIndex(indexName).walletKeys(wallet);

            for (const key of indexKeys[indexName]) {
                if (!walletKeys.includes(key)) {
                    this.getForgetIndex(indexName).set(key, wallet);
                }
            }
        }
    }

    private getForgetIndex(name: string): Contracts.State.WalletIndex {
        if (!this.forgetIndexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }
        return this.forgetIndexes[name];
    }

    private cloneAllByIndex(indexName: string) {
        for (const wallet of this.blockchainWalletRepository.getIndex(indexName).values()) {
            this.findByAddress(wallet.getAddress());
        }
    }
}
