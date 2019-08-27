import { Wallet } from "../../state/wallets";
import { Repository } from "./repository";

export interface WalletsRepository extends Repository {
    all(): Promise<Wallet[]>;

    findByAddress(address: string): Promise<Wallet>;

    tallyWithNegativeBalance(): Promise<number>;

    tallyWithNegativeVoteBalance(): Promise<number>;

    updateOrCreate(wallet: Wallet): Promise<void>;
}
