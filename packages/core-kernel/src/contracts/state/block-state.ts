import { Interfaces } from "@arkecosystem/crypto";

import { BigNumber } from "../../utils";
import { Wallet } from "./wallets";

export interface BlockState {
    applyBlock(block: Interfaces.IBlock): Promise<void>;

    revertBlock(block: Interfaces.IBlock): Promise<void>;

    applyTransaction(transaction: Interfaces.ITransaction): Promise<void>;

    revertTransaction(transaction: Interfaces.ITransaction): Promise<void>;

    increaseWalletDelegateVoteBalance(wallet: Wallet, amount: BigNumber): void;

    decreaseWalletDelegateVoteBalance(wallet: Wallet, amount: BigNumber): void;
}
