import { Interfaces } from "@arkecosystem/crypto";

import { Wallet, WalletDelegateAttributes } from "../state";

export interface Response<T> {
    data: T;
}

export interface DelegateWallet extends Wallet {
    delegate: WalletDelegateAttributes;
}

export interface CurrentRound {
    current: number;
    reward: string;
    timestamp: number;
    delegates: DelegateWallet[];
    currentForger: DelegateWallet;
    nextForger: DelegateWallet;
    lastBlock: Interfaces.IBlockData;
    canForge: boolean;
}

export interface ForgingTransactions {
    transactions: string[];
    poolSize: number;
    count: number;
}

export interface UnconfirmedTransactions {
    transactions: string[];
    poolSize: number;
}
