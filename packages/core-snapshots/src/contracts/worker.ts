import { Types } from "@arkecosystem/crypto";

export interface CryptoPackage {
    typeGroup: number;
    packageName: string;
}

export interface WorkerData {
    actionOptions: ActionOptions;
    connection?: any;
    cryptoPackages: CryptoPackage[];
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

    genesisBlockId?: string;
    updateStep?: number;

    network: Types.NetworkName;
}

export interface WorkerMessage {
    action: string;
    data: any;
}
