import { IWallet } from "../../core-state/wallets";
import { IParameters } from "./parameters";
import { IWalletsPaginated } from "./wallets-business-repository";

export interface IDelegatesBusinessRepository {
    search(params: IParameters): IWalletsPaginated;

    findById(id: string): IWallet;
}
