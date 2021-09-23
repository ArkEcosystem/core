import { IWallet } from "../../core-state";
import { IParameters } from "./parameters";
export interface IRowsPaginated<T> {
    rows: ReadonlyArray<T>;
    count: number;
}
export declare enum SearchScope {
    Wallets = 0,
    Delegates = 1,
    Locks = 2,
    Businesses = 3,
    Bridgechains = 4
}
export interface IWalletsBusinessRepository {
    search<T>(scope: SearchScope, params: IParameters): IRowsPaginated<T>;
    findById(searchScope: SearchScope, id: string): IWallet;
    count(searchScope: SearchScope): number;
    top(searchScope: SearchScope, params?: IParameters): IRowsPaginated<IWallet>;
}
