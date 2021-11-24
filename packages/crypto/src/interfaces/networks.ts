import { IBlockJson } from "./block";
import { IMilestone } from "./managers";

export interface NetworkConfig {
    exceptions: IExceptions;
    genesisBlock: IBlockJson;
    milestones: IMilestone[];
    network: Network;
}

export interface Network {
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
