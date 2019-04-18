import { IWallet } from "../wallet-manager";
import { IParameters } from "./parameters";

export interface IWalletsPaginated {
    rows: IWallet[];
    count: number;
}

export interface IWalletsBusinessRepository {
    search(params: IParameters): IWalletsPaginated;

    findAllByVote(publicKey: string, params?: IParameters): IWalletsPaginated;

    findById(id: string): IWallet;

    count(): number;

    top(params?: IParameters): IWalletsPaginated;
}
