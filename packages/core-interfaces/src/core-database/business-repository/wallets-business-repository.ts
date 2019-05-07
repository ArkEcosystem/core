import { IWallet } from "../wallet-manager";
import { IParameters } from "./parameters";

export interface IWalletsBusinessRepository {
    all(): IWallet[];

    findAll(params?: IParameters): { count: number; rows: IWallet[] };

    findAllByVote(publicKey: string, params?: IParameters): { count: number; rows: IWallet[] };

    findById(id: string): IWallet;

    count(): number;

    top(params?: IParameters): { count: number; rows: IWallet[] };

    search<T extends IParameters>(params: T): { count: number; rows: IWallet[] };
}
