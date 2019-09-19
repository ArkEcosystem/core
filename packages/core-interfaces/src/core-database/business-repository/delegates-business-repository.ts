import { IWallet } from "../../core-state/wallets";
import { IParameters } from "./parameters";
import { IRowsPaginated } from "./wallets-business-repository";

export interface IDelegatesBusinessRepository {
    search(params: IParameters): IRowsPaginated<IWallet>;

    findById(id: string): IWallet;
}
