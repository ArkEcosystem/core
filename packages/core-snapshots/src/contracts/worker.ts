import { Interfaces } from "@arkecosystem/crypto";

export interface WorkerAction {
    init(options: any): void;
    start(): Promise<void>;
    sync(data: any): void;
}

export interface WorkerData {
    actionOptions: ActionOptions;
    networkConfig: Interfaces.NetworkConfig;
    cryptoPackages: string[];
    connection?: any;
}

export interface WorkerSyncData {
    nextValue?: number;
    nextField?: string;
    nextCount?: number;
    height?: number;
}

export interface ActionOptions {
    action: string;
    table: string;
    start: number;
    end: number;
    codec: string;
    skipCompression: boolean;
    verify: boolean;
    filePath: string;
    updateStep?: number;
}

export interface WorkerMessage {
    action: string;
    data: any;
}

export interface WorkerResult {
    numberOfTransactions: number;
    height: number;
    count: number;
}
