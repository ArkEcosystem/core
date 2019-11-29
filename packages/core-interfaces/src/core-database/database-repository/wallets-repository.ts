import { IWallet } from "../../core-state/wallets";
import { IRepository } from "./repository";

export interface IWalletsRepository extends IRepository {
    all(): Promise<IWallet[]>;
    findByAddress(address: string): Promise<IWallet>;
}
