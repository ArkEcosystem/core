import { Interfaces } from "@arkecosystem/crypto";
import { IDelegateWallet } from "../core-state";

export interface IResponse<T> {
    data: T;
}

export interface ICurrentRound {
    current: number;
    reward: string;
    timestamp: number;
    delegates: IDelegateWallet[];
    currentForger: IDelegateWallet;
    nextForger: IDelegateWallet;
    lastBlock: Interfaces.IBlockData;
    canForge: boolean;
}

export interface IForgingTransactions {
    transactions: string[];
    poolSize: number;
    count: number;
}
