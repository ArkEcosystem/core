import { Container, Contracts, Exceptions } from "@arkecosystem/core-kernel";
import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "@packages/core-state/src/wallets/errors";
import { WalletIndex } from "@packages/core-state/src/wallets/wallet-index";
import { Identities, Utils } from "@packages/crypto";

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
            if (this.forgetIndexes[name]) {
                throw new WalletIndexAlreadyRegisteredError(name);
            }
            this.forgetIndexes[name] = new WalletIndex(indexer, autoIndex);
        }
    }

    public createWallet(address: string): Contracts.State.Wallet {
        return super.createWallet(address);
    }

    // public getIndex(name: string): Contracts.State.WalletIndex {
    //     throw new Exceptions.Logic.MethodNotImplemented("getIndex");
    // }

    public getIndexNames(): string[] {
        return super.getIndexNames();
    }

    public allByAddress(): ReadonlyArray<Contracts.State.Wallet> {
        throw new Exceptions.Logic.MethodNotImplemented("allByAddress");
    }

    public allByPublicKey(): ReadonlyArray<Contracts.State.Wallet> {
        throw new Exceptions.Logic.MethodNotImplemented("allByPublicKey");
    }

    public allByUsername(): ReadonlyArray<Contracts.State.Wallet> {
        throw new Exceptions.Logic.MethodNotImplemented("allByUsername");
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
            wallet.publicKey = publicKey;
            super.index(wallet);
        }

        return super.findByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public findByUsername(username: string): Contracts.State.Wallet {
        throw new Exceptions.Logic.MethodNotImplemented("findByUsername");
    }

    public findByIndex(index: string, key: string): Contracts.State.Wallet {
        if (!super.hasByIndex(index, key)) {
            const walletToClone = this.blockchainWalletRepository.findByIndex(index, key);
            this.cloneWallet(this.blockchainWalletRepository, walletToClone);
        }

        return this.getIndex(index).get(key)!;
    }

    public findByIndexes(indexes: string[], key: string): Contracts.State.Wallet {
        throw new Exceptions.Logic.MethodNotImplemented("findByIndexes");
    }

    public has(key: string): boolean {
        throw new Exceptions.Logic.MethodNotImplemented("has");
    }

    public hasByAddress(address: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.hasByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public hasByUsername(username: string): boolean {
        throw new Exceptions.Logic.MethodNotImplemented("hasByUsername");
    }

    public hasByIndex(indexName: string, key: string): boolean {
        return (
            this.getIndex(indexName).has(key) ||
            (this.blockchainWalletRepository.getIndex(indexName).has(key) && !this.getForgetIndex(indexName).has(key))
        );
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)) {
            return this.findByPublicKey(publicKey).nonce;
        }

        if (this.blockchainWalletRepository.hasByPublicKey(publicKey)) {
            return this.blockchainWalletRepository.findByPublicKey(publicKey).nonce;
        }

        return Utils.BigNumber.ZERO;
    }

    public index(wallets: Contracts.State.Wallet | Contracts.State.Wallet[]): void {
        if (Array.isArray(wallets)) {
            throw new Error("Not supported yet");
        }

        const indexKeys = {};
        for (const indexName of this.getIndexNames()) {
            indexKeys[indexName] = this.getIndex(indexName).walletKeys(wallets);
        }

        super.index(wallets);

        for (const indexName of this.getIndexNames()) {
            const walletKeys = this.getIndex(indexName).walletKeys(wallets);

            for (const key of indexKeys[indexName]) {
                if (!walletKeys.includes(key)) {
                    this.getForgetIndex(indexName).set(key, wallets);
                }
            }
        }
    }

    public reset(): void {
        throw new Exceptions.Logic.MethodNotImplemented("reset");
    }

    // public cloneWallet(
    //     origin: Contracts.State.WalletRepository,
    //     wallet: Contracts.State.Wallet,
    // ): Contracts.State.Wallet {
    //     throw new Exceptions.Logic.MethodNotImplemented("cloneWallet");
    // }

    public getForgetIndex(name: string): Contracts.State.WalletIndex {
        if (!this.forgetIndexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }
        return this.forgetIndexes[name];
    }
}
