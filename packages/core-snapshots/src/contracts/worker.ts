export interface WorkerData {
    actionOptions: ActionOptions;
    connection?: any;
}

export interface ActionOptions {
    action: string;
    table: string;
    codec: string;
    skipCompression: boolean;

    filePath: string;

    genesisBlockId?: string;
    updateStep?: number;

    network: string;
}

export interface WorkerMessage {
    action: string,
    data: any
}
