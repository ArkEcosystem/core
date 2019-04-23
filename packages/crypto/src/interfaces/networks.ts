import { IBlockJson } from "./block";

export interface INetworkConfig {
    exceptions: IExceptions;
    genesisBlock: IBlockJson;
    milestones: Array<Record<string, any>>;
    network: INetwork;
}

export interface INetwork {
    name: string;
    messagePrefix: string;
    bip32: {
        public: number;
        private: number;
    };
    pubKeyHash: number;
    nethash: string;
    wif: number;
    slip44: number;
    aip20: number;
    client: {
        token: string;
        symbol: string;
        explorer: string;
    };
}

export interface IExceptions {
    blocks?: string[];
    transactions?: string[];
    outlookTable?: Record<string, string>;
    transactionIdFixTable?: Record<string, string>;
}
