import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";

import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "./errors";
import { searchEntries } from "./utils/search-entries";
import { WalletIndex } from "./wallet-index";

// todo: review the implementation
@Container.injectable()
export class WalletRepository implements Contracts.State.WalletRepository {
    @Container.multiInject(Container.Identifiers.WalletRepositoryIndexerIndex)
    private readonly indexerIndexes!: Contracts.State.WalletIndexerIndex[];

    @Container.inject(Container.Identifiers.WalletFactory)
    private readonly createWalletFactory!: Contracts.State.WalletFactory;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    protected readonly indexes: Record<string, Contracts.State.WalletIndex> = {};

    @Container.postConstruct()
    public initialize(): void {
        for (const { name, indexer } of this.indexerIndexes) {
            if (this.indexes[name]) {
                throw new WalletIndexAlreadyRegisteredError(name);
            }
            this.indexes[name] = new WalletIndex(indexer);
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
        const forgottenWallet = this.getIndex(indexName).get(key);
        for (const index of Object.values(this.indexes)) {
            for (const [name, wallet] of index.entries()) {
                if (wallet.publicKey === forgottenWallet?.publicKey) {
                    index.forget(name);
                }
            }
        }
        // TODO: check whether this line is still needed?
        this.getIndex(indexName).forget(key);
    }

    public index(wallets: Contracts.State.Wallet | ReadonlyArray<Contracts.State.Wallet>): void {
        if (!Array.isArray(wallets)) {
            this.indexWallet(wallets as Contracts.State.Wallet);
        } else {
            for (const wallet of wallets) {
                this.indexWallet(wallet);
            }
        }
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }

    public search<T>(
        scope: Contracts.State.SearchScope,
        params: Contracts.Database.QueryParameters = {},
    ): Contracts.Search.ListResult<T> {
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
            case Contracts.State.SearchScope.Entities: {
                searchContext = this.searchEntities(params);
                break;
            }
        }

        return searchEntries(params, searchContext.query, searchContext.entries, searchContext.defaultOrder);
    }

    public findByScope(scope: Contracts.State.SearchScope, id: string): Contracts.State.Wallet {
        switch (scope) {
            case Contracts.State.SearchScope.Wallets: {
                const indexes = [
                    Contracts.State.WalletIndexes.Usernames,
                    Contracts.State.WalletIndexes.Addresses,
                    Contracts.State.WalletIndexes.PublicKeys,
                ];
                return this.findByIndexes(indexes, id);
            }
            case Contracts.State.SearchScope.Delegates: {
                const indexes = [
                    Contracts.State.WalletIndexes.Usernames,
                    Contracts.State.WalletIndexes.Addresses,
                    Contracts.State.WalletIndexes.PublicKeys,
                ];
                const wallet = this.findByIndexes(indexes, id);
                if (wallet && wallet.isDelegate() === false) {
                    throw new Error(`Wallet ${id} isn't delegate`);
                }
                return wallet;
            }
            default:
                throw new Error(`Unknown scope ${scope.toString()}`);
        }
    }

    public count(scope: Contracts.State.SearchScope): number {
        return this.search(scope, {}).count;
    }

    public top(
        scope: Contracts.State.SearchScope,
        params: Record<string, any> = {},
    ): Contracts.Search.ListResult<Contracts.State.Wallet> {
        return this.search(scope, { ...params, ...{ orderBy: "balance:desc" } });
    }

    private indexWallet(wallet: Contracts.State.Wallet): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.index(wallet);
        }
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
                entries = this.allByUsername().filter((delegate) => {
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
            entries = entries.map((delegate) => {
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
        params: Contracts.Database.QueryParameters,
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
                            this.stateStore.getLastBlock(),
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

    private searchEntities(params: Contracts.Database.QueryParameters): Contracts.State.SearchContext<any> {
        const query: Record<string, string[]> = {
            exact: ["id", "isResigned", "publicKey", "type", "subType"],
            like: ["name"],
        };

        const entries: any[] = this.getIndex("entities")
            .entries()
            .reduce((acc: any, [id, wallet]) => {
                const entities = wallet.getAttribute("entities", {});
                if (entities && entities[id]) {
                    const entity: any = entities[id];
                    acc.push({
                        id,
                        publicKey: wallet.publicKey,
                        address: wallet.address,
                        ...entity,
                        isResigned: !!entity.resigned,
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
