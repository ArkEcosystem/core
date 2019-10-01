import { Database, State } from "@arkecosystem/core-interfaces";
import { delegateCalculator, hasSomeProperty } from "@arkecosystem/core-utils";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { searchEntries } from "./utils/search-entries";

interface ISearchContext<T = any> {
    query: Record<string, string[]>;
    entries: ReadonlyArray<T>;
    defaultOrder: string[];
}

interface IUnwrappedHtlcLock {
    lockId: string;
    senderPublicKey: string;
    amount: Utils.BigNumber;
    recipientId: string;
    secretHash: string;
    expirationType: number;
    expirationValue: number;
}

export class WalletsBusinessRepository implements Database.IWalletsBusinessRepository {
    public constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public search<T>(scope: Database.SearchScope, params: Database.IParameters = {}): Database.IRowsPaginated<T> {
        let searchContext: ISearchContext;

        switch (scope) {
            case Database.SearchScope.Wallets: {
                searchContext = this.searchWallets(params);
                break;
            }
            case Database.SearchScope.Delegates: {
                searchContext = this.searchDelegates(params);
                break;
            }
            case Database.SearchScope.Locks: {
                searchContext = this.searchLocks(params);
                break;
            }
            case Database.SearchScope.Bridgechains: {
                searchContext = this.searchBridgechains(params);
                break;
            }
            case Database.SearchScope.Businesses: {
                searchContext = this.searchBusinesses(params);
                break;
            }
        }

        return searchEntries(params, searchContext.query, searchContext.entries, searchContext.defaultOrder);
    }

    public findById(scope: Database.SearchScope, id: string): State.IWallet {
        const walletManager: State.IWalletManager = this.databaseServiceProvider().walletManager;

        switch (scope) {
            case Database.SearchScope.Wallets: {
                return walletManager.findByIndex(
                    [State.WalletIndexes.Usernames, State.WalletIndexes.Addresses, State.WalletIndexes.PublicKeys],
                    id,
                );
            }

            case Database.SearchScope.Delegates: {
                const wallet: State.IWallet | undefined = walletManager.findByIndex(
                    [State.WalletIndexes.Usernames, State.WalletIndexes.Addresses, State.WalletIndexes.PublicKeys],
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

    public count(scope: Database.SearchScope): number {
        return this.search(scope, {}).count;
    }

    public top(scope: Database.SearchScope, params: Database.IParameters = {}): Database.IRowsPaginated<State.IWallet> {
        return this.search(scope, { ...params, ...{ orderBy: "balance:desc" } });
    }

    private searchWallets(params: Database.IParameters): ISearchContext<State.IWallet> {
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
            entries: this.databaseServiceProvider().walletManager.allByAddress(),
            defaultOrder: ["balance", "desc"],
        };
    }

    private searchDelegates(params: Database.IParameters): ISearchContext<State.IWallet> {
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

        let entries: ReadonlyArray<State.IWallet>;
        switch (params.type) {
            case "resigned": {
                entries = this.databaseServiceProvider()
                    .walletManager.getIndex(State.WalletIndexes.Resignations)
                    .values();
                break;
            }
            case "never-forged": {
                entries = this.databaseServiceProvider()
                    .walletManager.allByUsername()
                    .filter(delegate => {
                        return delegate.getAttribute("delegate.producedBlocks") === 0;
                    });
                break;
            }
            default: {
                entries = this.databaseServiceProvider().walletManager.allByUsername();
                break;
            }
        }

        const manipulators = {
            approval: delegateCalculator.calculateApproval,
            forgedTotal: delegateCalculator.calculateForgedTotal,
        };

        if (hasSomeProperty(params, Object.keys(manipulators))) {
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

    private searchLocks(params: Database.IParameters = {}): ISearchContext<IUnwrappedHtlcLock> {
        const query: Record<string, string[]> = {
            exact: ["senderPublicKey", "lockId", "recipientId", "secretHash", "expirationType"],
            between: ["expirationValue", "amount"],
        };

        if (params.amount !== undefined) {
            params.amount = "" + params.amount;
        }

        const entries: IUnwrappedHtlcLock[] = this.databaseServiceProvider()
            .walletManager.getIndex(State.WalletIndexes.Locks)
            .entries()
            .reduce((acc, [lockId, wallet]) => {
                const locks: Interfaces.IHtlcLocks = wallet.getAttribute("htlc.locks");
                if (locks && locks[lockId]) {
                    const lock: Interfaces.IHtlcLock = locks[lockId];
                    acc.push({
                        lockId,
                        amount: lock.amount,
                        secretHash: lock.secretHash,
                        senderPublicKey: wallet.publicKey,
                        recipientId: lock.recipientId,
                        expirationType: lock.expiration.type,
                        expirationValue: lock.expiration.value,
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
    private searchBusinesses(params: Database.IParameters = {}): ISearchContext<any> {
        const query: Record<string, string[]> = {};
        const entries: any[] = this.databaseServiceProvider()
            .walletManager.getIndex("businesses")
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
    private searchBridgechains(params: Database.IParameters = {}): ISearchContext<any> {
        const query: Record<string, string[]> = {};

        const entries: any[][] = this.databaseServiceProvider()
            .walletManager.getIndex("bridgechains")
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
