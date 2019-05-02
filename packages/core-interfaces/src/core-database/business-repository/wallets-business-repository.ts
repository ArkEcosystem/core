import { IWallet } from "../../core-state/wallets";
import { IParameters } from "./parameters";

export interface IWalletsPaginated {
    rows: IWallet[];
    count: number;
}

export interface IWalletsBusinessRepository {
    all(): IWallet[];

    findAll(params?: IParameters): IWalletsPaginated;

    findAllByVote(publicKey: string, params?: IParameters): IWalletsPaginated;

    findById(id: string): IWallet;

    count(): number;

    top(params?: IParameters): IWalletsPaginated;

    search<T extends IParameters>(params: T): IWalletsPaginated;
}
