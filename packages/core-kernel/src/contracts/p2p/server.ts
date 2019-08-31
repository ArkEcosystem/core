import { Interfaces } from "@arkecosystem/crypto";

import { Wallet } from "../state";

export interface Response<T> {
    data: T;
}

export interface CurrentRound {
    current: number;
    reward: string;
    timestamp: number;
    delegates: Wallet[];
    currentForger: Wallet;
    nextForger: Wallet;
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
