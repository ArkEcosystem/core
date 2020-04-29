import { Types } from "@arkecosystem/crypto";

export interface WorkerData {
    actionOptions: ActionOptions;
    connection?: any;
}

export interface ActionOptions {
    action: string;
    table: string;
    start: number,
    end: number,
    codec: string;
    skipCompression: boolean;

    filePath: string;

    genesisBlockId?: string;
    updateStep?: number;

    network: Types.NetworkName;
}

export interface WorkerMessage {
    action: string,
    data: any
}
