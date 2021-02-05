import { Interfaces } from "@arkecosystem/crypto";

export interface WorkerData {
    actionOptions: ActionOptions;
    networkConfig: Interfaces.NetworkConfig;
    connection?: any;
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
