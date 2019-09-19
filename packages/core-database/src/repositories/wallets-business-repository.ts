import { Database, State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { searchEntries } from "./utils/search-entries";

interface ISearchContext<T = any> {
    query: Record<string, string[]>;
    entries: T[];
    defaultOrder: string[];
}

export class WalletsBusinessRepository implements Database.IWalletsBusinessRepository {
    public constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public search<T>(searchScope: Database.SearchScope, params: Database.IParameters = {}): Database.IRowsPaginated<T> {
        let searchContext: ISearchContext;

        switch (searchScope) {
            case Database.SearchScope.Wallets: {
                searchContext = this.searchWallets(params);
                break;
            }
            case Database.SearchScope.Locks: {
                searchContext = this.searchLocks(params);
                break;
            }
            case Database.SearchScope.Wallets: {
                this.searchWallets(params);
                break;
            }
            case Database.SearchScope.Wallets: {
                this.searchWallets(params);
                break;
            }
        }

        return searchEntries(params, searchContext.query, searchContext.entries, searchContext.defaultOrder);
    }

    public findAllByVote(publicKey: string, params: Database.IParameters = {}): Database.IRowsPaginated<State.IWallet> {
        return this.search(Database.SearchScope.Wallets, { ...params, ...{ vote: publicKey } });
    }

    public findById(id: string): State.IWallet {
        const walletManager: State.IWalletManager = this.databaseServiceProvider().walletManager;
        return walletManager.findByIndex(
            [State.WalletIndexes.Usernames, State.WalletIndexes.Addresses, State.WalletIndexes.PublicKeys],
            id,
        );
    }

    public count(): number {
        return this.search(Database.SearchScope.Wallets, {}).count;
    }

    public top(params: Database.IParameters = {}): Database.IRowsPaginated<State.IWallet> {
        return this.search(Database.SearchScope.Wallets, { ...params, ...{ orderBy: "balance:desc" } });
    }

    private searchWallets(params: Database.IParameters): ISearchContext<State.IWallet> {
        const query: Record<string, string[]> = {
            exact: ["address", "publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance"],
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
            entries: this.databaseServiceProvider().walletManager.allByAddress() as any,
            defaultOrder: ["balance", "desc"],
        };
    }

    private searchLocks(params: Database.IParameters = {}): ISearchContext<Interfaces.IHtlcLock> {
        const query: Record<string, string[]> = {
            exact: ["publicKey", "lockId", "recipientId"],
            between: ["expiration", "lockBalance"],
        };

        const entries: Interfaces.IHtlcLock[] = this.databaseServiceProvider()
            .walletManager.getIndex(State.WalletIndexes.Locks)
            .all()
            .map(wallet => wallet.getAttribute("htlc.locks"));

        return {
            query,
            entries,
            defaultOrder: ["expiration", "asc"],
        };
    }
}
