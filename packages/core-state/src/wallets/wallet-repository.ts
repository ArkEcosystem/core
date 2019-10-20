import { Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "./errors";
import { TempWalletRepository } from "./temp-wallet-repository";
import { Wallet } from "./wallet";
import { WalletIndex } from "./wallet-index";

// todo: review the implementation
export class WalletRepository implements Contracts.State.WalletRepository {
    protected readonly indexes: Record<string, Contracts.State.WalletIndex> = {};

    public constructor() {
        this.reset();

        this.registerIndex(
            Contracts.State.WalletIndexes.Addresses,
            (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
                if (wallet.address) {
                    index.set(wallet.address, wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.PublicKeys,
            (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
                if (wallet.publicKey) {
                    index.set(wallet.publicKey, wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.Usernames,
            (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
                if (wallet.isDelegate()) {
                    index.set(wallet.getAttribute("delegate.username"), wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.Resignations,
            (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
                if (wallet.isDelegate() && wallet.getAttribute("delegate.resigned")) {
                    index.set(wallet.getAttribute("delegate.username"), wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.Locks,
            (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
                const locks = wallet.getAttribute("htlc.locks");
                if (locks) {
                    for (const lockId of Object.keys(locks)) {
                        index.set(lockId, wallet);
                    }
                }
            },
        );
    }

    public registerIndex(name: string, indexer: Contracts.State.WalletIndexer): void {
        if (this.indexes[name]) {
            throw new WalletIndexAlreadyRegisteredError(name);
        }

        this.indexes[name] = new WalletIndex(indexer);
    }

    public unregisterIndex(name: string): void {
        if (!this.indexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }

        delete this.indexes[name];
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

    public findById(id: string): Contracts.State.Wallet {
        for (const index of Object.values(this.indexes)) {
            const wallet: Contracts.State.Wallet = index.get(id);

            if (wallet) {
                return wallet;
            }
        }

        return undefined;
    }

    public findByAddress(address: string): Contracts.State.Wallet {
        const index: Contracts.State.WalletIndex = this.getIndex(Contracts.State.WalletIndexes.Addresses);

        if (address && !index.has(address)) {
            index.set(address, new Wallet(address));
        }

        return index.get(address);
    }

    public findByPublicKey(publicKey: string): Contracts.State.Wallet {
        const index: Contracts.State.WalletIndex = this.getIndex(Contracts.State.WalletIndexes.PublicKeys);

        if (publicKey && !index.has(publicKey)) {
            const address: string = Identities.Address.fromPublicKey(publicKey);

            const wallet: Contracts.State.Wallet = this.findByAddress(address);
            wallet.publicKey = publicKey;

            index.set(publicKey, wallet);
        }

        return index.get(publicKey);
    }

    public findByUsername(username: string): Contracts.State.Wallet {
        return this.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public findByIndex(indexName: string, key: string): Contracts.State.Wallet | undefined {
        return this.getIndex(indexName).get(key);
    }

    public has(key: string): boolean {
        for (const walletIndex of Object.values(this.indexes)) {
            if (walletIndex.has(key)) {
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
        return this.getIndex(indexName).has(key);
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.hasByPublicKey(publicKey)) {
            return this.findByPublicKey(publicKey).nonce;
        }

        return Utils.BigNumber.ZERO;
    }

    public forgetByAddress(address: string): void {
        this.forgetByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public forgetByPublicKey(publicKey: string): void {
        this.forgetByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public forgetByUsername(username: string): void {
        this.forgetByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public forgetByIndex(indexName: string, key: string): void {
        this.getIndex(indexName).forget(key);
    }

    public index(wallets: ReadonlyArray<Contracts.State.Wallet>): void {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }

    public reindex(wallet: Contracts.State.Wallet): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.index(wallet);
        }
    }

    public clone(): Contracts.State.WalletRepository {
        // @todo: ioc
        return new TempWalletRepository(this);
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }
}
