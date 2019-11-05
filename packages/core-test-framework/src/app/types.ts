import { Application, Container } from "@arkecosystem/core-kernel";
import { Paths } from "env-paths";

export interface CoreArguments {
    flags?: {
        token: string;
        network: string;
        env?: string;
        paths?: Paths;
    };
    plugins?: {
        include?: string[];
        exclude?: string[];
        options?: Record<string, Record<string, any>>;
    };
}

export interface CryptoArguments {
    network?: string;
    premine?: string;
    delegates?: number;
    blocktime?: number;
    maxTxPerBlock?: number;
    maxBlockPayload?: number;
    rewardHeight?: number;
    rewardAmount?: number;
    pubKeyHash?: number;
    wif?: number;
    token?: string;
    symbol?: string;
    explorer?: string;
    distribute?: boolean;
}

export interface SetUpArguments {
    core: CoreArguments;
    crypto: CryptoArguments;
}

export interface ConfigPaths {
    core: {
        root: string;
        env: string;
        app: string;
        delegates: string;
        peers: string;
    };
    crypto: {
        root: string;
        exceptions: string;
        genesisBlock: string;
        milestones: string;
        network: string;
    };
}

export type SandboxCallback = (context: { app: Application; container: Container.interfaces.Container }) => void;
