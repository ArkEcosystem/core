import { IWallet } from "../wallet-manager";
import { IParameters } from "./parameters";

export interface IDelegatesBusinessRepository {
    getLocalDelegates(): IWallet[];

    findAll(params?: IParameters): { count: number; rows: IWallet[] };

    search<T extends IParameters>(params: T): { count: number; rows: IWallet[] };

    findById(id: string): IWallet;

    getActiveAtHeight(height: number): Promise<IWallet[]>;
}
