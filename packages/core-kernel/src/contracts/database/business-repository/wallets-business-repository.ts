import { Wallet } from "../../state/wallets";
import { Parameters } from "./parameters";

export interface WalletsPaginated {
    rows: ReadonlyArray<Wallet>;
    count: number;
}

export interface WalletsBusinessRepository {
    search(params: Parameters): WalletsPaginated;

    findAllByVote(publicKey: string, params?: Parameters): WalletsPaginated;

    findById(id: string): Wallet;

    count(): number;

    top(params?: Parameters): WalletsPaginated;
}
