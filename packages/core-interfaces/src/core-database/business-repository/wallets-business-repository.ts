import { IWallet } from "../../core-state";
import { IParameters } from "./parameters";

export interface IRowsPaginated<T> {
    rows: ReadonlyArray<T>;
    count: number;
}

export enum SearchScope {
    Wallets,
    Locks,
    Businesses,
    Bridgechains,
}

export interface IWalletsBusinessRepository {
    search<T extends object>(scope: SearchScope, params: IParameters): IRowsPaginated<T>;

    findAllByVote(publicKey: string, params?: IParameters): IRowsPaginated<IWallet>;

    findById(id: string): IWallet;

    count(): number;

    top(params?: IParameters): IRowsPaginated<IWallet>;
}
