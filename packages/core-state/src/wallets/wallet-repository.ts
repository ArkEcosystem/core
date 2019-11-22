import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";

import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "./errors";
import { TempWalletRepository } from "./temp-wallet-repository";
import { searchEntries } from "./utils/search-entries";
import { Wallet } from "./wallet";
import { WalletIndex } from "./wallet-index";

// todo: review the implementation
@Container.injectable()
export class WalletRepository implements Contracts.State.WalletRepository {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    protected readonly indexes: Record<string, Contracts.State.WalletIndex> = {};

    // TODO: use a inversify factory for wallets instead?
    public createWallet(address: string): Contracts.State.Wallet {
        return new Wallet(address, this.app);
    }

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
                if (wallet.isDelegate() && wallet.hasAttribute("delegate.resigned")) {
                    index.set(wallet.getAttribute("delegate.username"), wallet);
                }
            },
        );

        this.registerIndex(
            Contracts.State.WalletIndexes.Locks,
            (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
                if (wallet.hasAttribute("htlc.locks")) {
                    const locks: object = wallet.getAttribute("htlc.locks");

                    for (const lockId of Object.keys(locks)) {
                        index.set(lockId, wallet);
                    }
                }
            },
        );

        this.registerIndex(Contracts.State.WalletIndexes.Ipfs, (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
            if (wallet.hasAttribute("ipfs.hashes")) {
                const hashes = wallet.getAttribute("ipfs.hashes");
                for (const hash of Object.keys(hashes)) {
                    index.set(hash, wallet);
                }
            }
        });
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
            const wallet: Contracts.State.Wallet | undefined = index.get(id);

            if (wallet) {
                return wallet;
            }
        }

        throw new Error(`A wallet with the ID [${id}] does not exist.`);
    }

    public findByAddress(address: string): Contracts.State.Wallet {
        const index: Contracts.State.WalletIndex = this.getIndex(Contracts.State.WalletIndexes.Addresses);

        if (address && !index.has(address)) {
            index.set(address, new Wallet(address, this.app));
        }

        const wallet: Contracts.State.Wallet | undefined = index.get(address);

        AppUtils.assert.defined<Contracts.State.Wallet>(wallet);

        return wallet;
    }

    public findByPublicKey(publicKey: string): Contracts.State.Wallet {
        const index: Contracts.State.WalletIndex = this.getIndex(Contracts.State.WalletIndexes.PublicKeys);

        if (publicKey && !index.has(publicKey)) {
            const wallet: Contracts.State.Wallet = this.findByAddress(Identities.Address.fromPublicKey(publicKey));
            wallet.publicKey = publicKey;

            index.set(publicKey, wallet);
        }

        const wallet: Contracts.State.Wallet | undefined = index.get(publicKey);

        AppUtils.assert.defined<Contracts.State.Wallet>(wallet);

        return wallet;
    }

    public findByUsername(username: string): Contracts.State.Wallet {
        return this.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public findByIndex(index: string | string[], key: string): Contracts.State.Wallet {
        if (!Array.isArray(index)) {
            index = [index];
        }

        for (const name of index) {
            const index: Contracts.State.WalletIndex = this.getIndex(name);

            if (index.has(key)) {
                const wallet: Contracts.State.Wallet | undefined = index.get(key);

                AppUtils.assert.defined<Contracts.State.Wallet>(wallet);

                return wallet;
            }
        }

        throw new Error(`A wallet with the ID [${key}] does not exist in the [${index.join(",")}] index.`);
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

    public clone(): Contracts.State.TempWalletRepository {
        return this.app.resolve<TempWalletRepository>(TempWalletRepository).setup(this);
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }

    public search<T>(
        scope: Contracts.State.SearchScope,
        params: Contracts.Database.QueryParameters = {},
    ): Contracts.State.RowsPaginated<T> {
        let searchContext: Contracts.State.SearchContext;

        switch (scope) {
            case Contracts.State.SearchScope.Wallets: {
                searchContext = this.searchWallets(params);
                break;
            }
            case Contracts.State.SearchScope.Delegates: {
                searchContext = this.searchDelegates(params);
                break;
            }
            case Contracts.State.SearchScope.Locks: {
                searchContext = this.searchLocks(params);
                break;
            }
            case Contracts.State.SearchScope.Bridgechains: {
                searchContext = this.searchBridgechains(params);
                break;
            }
            case Contracts.State.SearchScope.Businesses: {
                searchContext = this.searchBusinesses(params);
                break;
            }
        }

        return searchEntries(params, searchContext.query, searchContext.entries, searchContext.defaultOrder);
    }

    public findByScope(scope: Contracts.State.SearchScope, id: string): Contracts.State.Wallet {
        switch (scope) {
            case Contracts.State.SearchScope.Wallets: {
                return this.findByIndex(
                    [
                        Contracts.State.WalletIndexes.Usernames,
                        Contracts.State.WalletIndexes.Addresses,
                        Contracts.State.WalletIndexes.PublicKeys,
                    ],
                    id,
                );
            }

            case Contracts.State.SearchScope.Delegates: {
                const wallet: Contracts.State.Wallet | undefined = this.findByIndex(
                    [
                        Contracts.State.WalletIndexes.Usernames,
                        Contracts.State.WalletIndexes.Addresses,
                        Contracts.State.WalletIndexes.PublicKeys,
                    ],
                    id,
                );

                if (wallet && wallet.isDelegate()) {
                    return wallet;
                }

                break;
            }
        }

        throw new Error(`A wallet with the ID [${id}] does not exist in the [${scope.toString()}] scope.`);
    }

    public count(scope: Contracts.State.SearchScope): number {
        return this.search(scope, {}).count;
    }

    public top(
        scope: Contracts.State.SearchScope,
        params: Record<string, any> = {},
    ): Contracts.State.RowsPaginated<Contracts.State.Wallet> {
        return this.search(scope, { ...params, ...{ orderBy: "balance:desc" } });
    }

    private searchWallets(
        params: Contracts.Database.QueryParameters,
    ): Contracts.State.SearchContext<Contracts.State.Wallet> {
        const query: Record<string, string[]> = {
            exact: ["address", "publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance", "lockedBalance"],
        };

        if (params.addresses) {
            // Use the `in` filter instead of `exact` for the `address` field
            if (!params.address) {
                // @ts-ignore
                params.address = params.addresses;
                query.exact.shift();
                query.in = ["address"];
            }

            delete params.addresses;
        }

        return {
            query,
            entries: this.allByAddress(),
            defaultOrder: ["balance", "desc"],
        };
    }

    private searchDelegates(
        params: Contracts.Database.QueryParameters,
    ): Contracts.State.SearchContext<Contracts.State.Wallet> {
        const query: Record<string, string[]> = {
            exact: ["address", "publicKey"],
            like: ["username"],
            between: ["approval", "forgedFees", "forgedRewards", "forgedTotal", "producedBlocks", "voteBalance"],
        };

        if (params.usernames) {
            if (!params.username) {
                params.username = params.usernames;
                query.like.shift();
                query.in = ["username"];
            }

            delete params.usernames;
        }

        let entries: ReadonlyArray<Contracts.State.Wallet>;
        switch (params.type) {
            case "resigned": {
                entries = this.getIndex(Contracts.State.WalletIndexes.Resignations).values();
                break;
            }
            case "never-forged": {
                entries = this.allByUsername().filter(delegate => {
                    return delegate.getAttribute("delegate.producedBlocks") === 0;
                });
                break;
            }
            default: {
                entries = this.allByUsername();
                break;
            }
        }

        const manipulators = {
            approval: AppUtils.delegateCalculator.calculateApproval,
            forgedTotal: AppUtils.delegateCalculator.calculateForgedTotal,
        };

        if (AppUtils.hasSomeProperty(params, Object.keys(manipulators))) {
            entries = entries.map(delegate => {
                for (const [prop, method] of Object.entries(manipulators)) {
                    if (params.hasOwnProperty(prop)) {
                        delegate.setAttribute(`delegate.${prop}`, method(delegate));
                    }
                }

                return delegate;
            });
        }

        return {
            query,
            entries,
            defaultOrder: ["rank", "asc"],
        };
    }

    private searchLocks(
        params: Contracts.Database.QueryParameters = {},
    ): Contracts.State.SearchContext<Contracts.State.UnwrappedHtlcLock> {
        const query: Record<string, string[]> = {
            exact: [
                "expirationType",
                "isExpired",
                "lockId",
                "recipientId",
                "secretHash",
                "senderPublicKey",
                "vendorField",
            ],
            between: ["expirationValue", "amount", "timestamp"],
        };

        if (params.amount !== undefined) {
            params.amount = "" + params.amount;
        }

        const entries: Contracts.State.UnwrappedHtlcLock[] = this.getIndex(Contracts.State.WalletIndexes.Locks)
            .entries()
            .reduce<Contracts.State.UnwrappedHtlcLock[]>((acc, [lockId, wallet]) => {
                const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks");

                if (locks && locks[lockId]) {
                    const lock: Interfaces.IHtlcLock = locks[lockId];

                    AppUtils.assert.defined<string>(lock.recipientId);
                    AppUtils.assert.defined<string>(wallet.publicKey);

                    acc.push({
                        lockId,
                        amount: lock.amount,
                        secretHash: lock.secretHash,
                        senderPublicKey: wallet.publicKey,
                        recipientId: lock.recipientId,
                        timestamp: lock.timestamp,
                        expirationType: lock.expiration.type,
                        expirationValue: lock.expiration.value,
                        isExpired: AppUtils.expirationCalculator.calculateLockExpirationStatus(
                            this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastBlock(),
                            lock.expiration,
                        ),
                        vendorField: lock.vendorField!,
                    });
                }

                return acc;
            }, []);

        return {
            query,
            entries,
            defaultOrder: ["lockId", "asc"],
        };
    }

    private searchBusinesses(params: Contracts.Database.QueryParameters = {}): Contracts.State.SearchContext<any> {
        const query: Record<string, string[]> = {
            exact: ["businessId", "vat"],
            like: ["name", "repository", "website"],
        };

        const entries: any[] = this.getIndex("businesses")
            .values()
            .map(wallet => {
                const business: any = wallet.getAttribute("business");
                return {
                    address: wallet.address,
                    businessId: business.businessId,
                    ...business.businessAsset,
                };
            });

        return {
            query,
            entries,
            defaultOrder: ["name", "asc"],
        };
    }

    private searchBridgechains(params: Contracts.Database.QueryParameters = {}): Contracts.State.SearchContext<any> {
        const query: Record<string, string[]> = {
            exact: ["bridgechainId", "businessId"],
            like: ["bridgechainRepository", "name"],
            every: ["seedNodes"],
        };

        const entries: any[] = this.getIndex("bridgechains")
            .entries()
            .reduce((acc: any, [bridgechainId, wallet]) => {
                const business: any = wallet.getAttribute("business");
                const bridgechains: any[] = wallet.getAttribute("business.bridgechains");
                if (bridgechains && bridgechains[bridgechainId]) {
                    const bridgechain: any = bridgechains[bridgechainId];
                    acc.push({
                        bridgechainId: bridgechain.bridgechainId,
                        businessId: business.businessId,
                        ...bridgechain.bridgechainAsset,
                    });
                }

                return acc;
            }, []);

        return {
            query,
            entries,
            defaultOrder: ["name", "asc"],
        };
    }
}
