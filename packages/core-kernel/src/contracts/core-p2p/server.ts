import { Interfaces } from "@arkecosystem/crypto";
import { IWallet } from "../core-state";

export interface IResponse<T> {
    data: T;
}

export interface ICurrentRound {
    current: number;
    reward: string;
    timestamp: number;
    delegates: IWallet[];
    currentForger: IWallet;
    nextForger: IWallet;
    lastBlock: Interfaces.IBlockData;
    canForge: boolean;
}

export interface IForgingTransactions {
    transactions: string[];
    poolSize: number;
    count: number;
}

export interface IUnconfirmedTransactions {
    transactions: string[];
    poolSize: number;
}
