import { IWallet } from "../wallet-manager";
import { IParameters } from "./parameters";
import { IWalletsPaginated } from "./wallets-business-repository";

export interface IDelegatesBusinessRepository {
    getLocalDelegates(): IWallet[];

    findAll(params?: IParameters): IWalletsPaginated;

    search<T extends IParameters>(params: T): IWalletsPaginated;

    findById(id: string): IWallet;
}
