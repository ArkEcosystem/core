import { Contracts } from "../..";

export interface WalletsTableService {
    flush(): Promise<void>;
    sync(wallets: readonly Contracts.State.Wallet[]): Promise<void>;
}
