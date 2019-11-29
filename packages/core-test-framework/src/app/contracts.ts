import { Application, Container } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { Paths } from "env-paths";

export interface Wallet {
    address: string;
    passphrase: string;
    keys: Interfaces.IKeyPair;
    username: string | undefined;
}

export interface CoreOptions {
    flags?: {
        token: string;
        network: string;
        env?: string;
        paths?: Paths;
    };
    plugins?: {
        options?: Record<string, Record<string, any>>;
    };
    peers?: {};
    delegates?: {};
    environment?: {};
    app?: {};
}

export interface CryptoOptions {
    network: string;
    premine: string;
    delegates: number;
    blocktime: number;
    maxTxPerBlock: number;
    maxBlockPayload: number;
    rewardHeight: number;
    rewardAmount: number;
    pubKeyHash: number;
    wif: number;
    token: string;
    symbol: string;
    explorer: string;
    distribute: boolean;
}

export interface SandboxOptions {
    core: CoreOptions;
    crypto: CryptoOptions;
}

export interface CoreConfigPaths {
    root: string;
    env: string;
    app: string;
    delegates: string;
    peers: string;
}

export interface CryptoConfigPaths {
    root: string;
    exceptions: string;
    genesisBlock: string;
    milestones: string;
    network: string;
}

export type SandboxCallback = (context: { app: Application; container: Container.interfaces.Container }) => void;
