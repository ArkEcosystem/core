import { Wallet } from "../../state/wallets";
import { Parameters } from "./parameters";

export interface RowsPaginated<T> {
    rows: ReadonlyArray<T>;
    count: number;
}

export enum SearchScope {
    Wallets,
    Delegates,
    Locks,
    Businesses,
    Bridgechains,
}

export interface WalletsBusinessRepository {
    search<T>(scope: SearchScope, params: Parameters): RowsPaginated<T>;

    findById(searchScope: SearchScope, id: string): Wallet;

    count(searchScope: SearchScope): number;

    top(searchScope: SearchScope, params?: Parameters): RowsPaginated<Wallet>;
}
