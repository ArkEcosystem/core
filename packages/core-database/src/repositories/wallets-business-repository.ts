import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import { searchEntries } from "./utils/search-entries";

interface SearchContext<T = any> {
    query: Record<string, string[]>;
    entries: ReadonlyArray<T>;
    defaultOrder: string[];
}

interface UnwrappedHtlcLock {
    lockId: string;
    senderPublicKey: string;
    amount: Utils.BigNumber;
    recipientId: string;
    secretHash: string;
    timestamp: number;
    expirationType: number;
    expirationValue: number;
    vendorField: string;
}

export class WalletsBusinessRepository implements Contracts.Database.WalletsBusinessRepository {
    public constructor (private readonly databaseServiceProvider: () => Contracts.Database.DatabaseService) { }

    public search<T>(
        scope: Contracts.Database.SearchScope,
        params: Contracts.Database.Parameters = {},
    ): Contracts.Database.RowsPaginated<T> {
        let searchContext: SearchContext;

        switch (scope) {
            case Contracts.Database.SearchScope.Wallets: {
                searchContext = this.searchWallets(params);
                break;
            }
            case Contracts.Database.SearchScope.Delegates: {
                searchContext = this.searchDelegates(params);
                break;
            }
            case Contracts.Database.SearchScope.Locks: {
                searchContext = this.searchLocks(params);
                break;
            }
            case Contracts.Database.SearchScope.Bridgechains: {
                searchContext = this.searchBridgechains(params);
                break;
            }
            case Contracts.Database.SearchScope.Businesses: {
                searchContext = this.searchBusinesses(params);
                break;
            }
        }

        return searchEntries(params, searchContext.query, searchContext.entries, searchContext.defaultOrder);
    }

    public findById(scope: Contracts.Database.SearchScope, id: string): Contracts.State.Wallet {
        const walletRepository: Contracts.State.WalletRepository = this.databaseServiceProvider().walletRepository;

        switch (scope) {
            case Contracts.Database.SearchScope.Wallets: {
                return walletRepository.findByIndex(
                    [
                        Contracts.State.WalletIndexes.Usernames,
                        Contracts.State.WalletIndexes.Addresses,
                        Contracts.State.WalletIndexes.PublicKeys,
                    ],
                    id,
                );
            }

            case Contracts.Database.SearchScope.Delegates: {
                const wallet: Contracts.State.Wallet = walletRepository.findByIndex(
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

        return undefined;
    }

    public count(scope: Contracts.Database.SearchScope): number {
        return this.search(scope, {}).count;
    }

    public top(
        scope: Contracts.Database.SearchScope,
        params: Contracts.Database.Parameters = {},
    ): Contracts.Database.RowsPaginated<Contracts.State.Wallet> {
        return this.search(scope, { ...params, ...{ orderBy: "balance:desc" } });
    }

    private searchWallets(params: Contracts.Database.Parameters): SearchContext<Contracts.State.Wallet> {
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
            entries: this.databaseServiceProvider().walletRepository.allByAddress(),
            defaultOrder: ["balance", "desc"],
        };
    }

    private searchDelegates(params: Contracts.Database.Parameters): SearchContext<Contracts.State.Wallet> {
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
                entries = this.databaseServiceProvider()
                    .walletRepository.getIndex(Contracts.State.WalletIndexes.Resignations)
                    .values();
                break;
            }
            case "never-forged": {
                entries = this.databaseServiceProvider()
                    .walletRepository.allByUsername()
                    .filter(delegate => {
                        return delegate.getAttribute("delegate.producedBlocks") === 0;
                    });
                break;
            }
            default: {
                entries = this.databaseServiceProvider().walletRepository.allByUsername();
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

    private searchLocks(params: Contracts.Database.Parameters = {}): SearchContext<UnwrappedHtlcLock> {
        const query: Record<string, string[]> = {
            exact: ["senderPublicKey", "lockId", "recipientId", "secretHash", "expirationType", "vendorField"],
            between: ["expirationValue", "amount", "timestamp"],
        };

        if (params.amount !== undefined) {
            params.amount = "" + params.amount;
        }

        const entries: UnwrappedHtlcLock[] = this.databaseServiceProvider()
            .walletRepository.getIndex(Contracts.State.WalletIndexes.Locks)
            .entries()
            .reduce<UnwrappedHtlcLock[]>((acc, [lockId, wallet]) => {
                const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks");
                if (locks && locks[lockId]) {
                    const lock: Interfaces.IHtlcLock = locks[lockId];
                    acc.push({
                        lockId,
                        amount: lock.amount,
                        secretHash: lock.secretHash,
                        senderPublicKey: wallet.publicKey,
                        recipientId: lock.recipientId,
                        timestamp: lock.timestamp,
                        expirationType: lock.expiration.type,
                        expirationValue: lock.expiration.value,
                        vendorField: lock.vendorField,
                    });
                }

                return acc;
            }, []);

        return {
            query,
            entries,
            defaultOrder: ["expirationValue", "asc"],
        };
    }

    // TODO
    private searchBusinesses(params: Contracts.Database.Parameters = {}): SearchContext<any> {
        const query: Record<string, string[]> = {};
        const entries: any[] = this.databaseServiceProvider()
            .walletRepository.getIndex("businesses")
            .values()
            .map(wallet => {
                const business: Interfaces.IHtlcLocks = wallet.getAttribute("business");
                return business;
            })
            .filter(business => !!business);

        return {
            query,
            entries,
            defaultOrder: ["expirationValue", "asc"],
        };
    }

    // TODO
    private searchBridgechains(params: Contracts.Database.Parameters = {}): SearchContext<any> {
        const query: Record<string, string[]> = {};

        const entries: any[][] = this.databaseServiceProvider()
            .walletRepository.getIndex("bridgechains")
            .values()
            .map(wallet => {
                return wallet.getAttribute("business.bridgechains");
            })
            .filter(bridgchain => !!bridgchain);

        return {
            query,
            entries,
            defaultOrder: ["expirationValue", "asc"],
        };
    }
}
