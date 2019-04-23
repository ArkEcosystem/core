import { IWallet } from "../wallet-manager";
import { IRepository } from "./repository";

export interface IWalletsRepository extends IRepository {
    all(): Promise<IWallet[]>;

    findByAddress(address: string): Promise<IWallet>;

    tallyWithNegativeBalance(): Promise<number>;

    tallyWithNegativeVoteBalance(): Promise<number>;

    updateOrCreate(wallet: IWallet): Promise<void>;
}
