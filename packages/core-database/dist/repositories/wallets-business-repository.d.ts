import { Database, State } from "@arkecosystem/core-interfaces";
export declare class WalletsBusinessRepository implements Database.IWalletsBusinessRepository {
    private readonly databaseServiceProvider;
    constructor(databaseServiceProvider: () => Database.IDatabaseService);
    search<T>(scope: Database.SearchScope, params?: Database.IParameters): Database.IRowsPaginated<T>;
    findById(scope: Database.SearchScope, id: string): State.IWallet;
    count(scope: Database.SearchScope): number;
    top(scope: Database.SearchScope, params?: Database.IParameters): Database.IRowsPaginated<State.IWallet>;
    private searchWallets;
    private searchDelegates;
    private searchLocks;
    private searchBusinesses;
    private searchBridgechains;
}
