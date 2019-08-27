import { Wallet } from "../../state/wallets";
import { Parameters } from "./parameters";
import { WalletsPaginated } from "./wallets-business-repository";

export interface DelegatesBusinessRepository {
    search(params: Parameters): WalletsPaginated;

    findById(id: string): Wallet;
}
