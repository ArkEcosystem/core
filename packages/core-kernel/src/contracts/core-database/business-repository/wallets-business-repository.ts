import { IWallet } from "../../core-state/wallets";
import { IParameters } from "./parameters";

export interface IWalletsPaginated {
    rows: ReadonlyArray<IWallet>;
    count: number;
}

export interface IWalletsBusinessRepository {
    search(params: IParameters): IWalletsPaginated;

    findAllByVote(publicKey: string, params?: IParameters): IWalletsPaginated;

    findById(id: string): IWallet;

    count(): number;

    top(params?: IParameters): IWalletsPaginated;
}
