export declare const writeMetaFile: (snapshotInfo: any) => void;
export declare const getFilePath: (filename: any, folder: any) => string;
export declare const copySnapshot: (sourceFolder: any, destFolder: any) => void;
export declare const calcRecordCount: (table: any, currentCount: any, sourceFolder: any) => any;
export declare const calcStartHeight: (table: any, currentHeight: any, sourceFolder: any) => any;
export declare const getSnapshotInfo: (folder: any) => {
    startHeight: number;
    endHeight: number;
    folder: any;
    blocks: any;
    transactions: any;
    rounds: any;
    skipCompression: any;
};
export declare const readMetaJSON: (folder: any) => any;
export declare const setSnapshotInfo: (options: any, lastBlock: any) => {
    startHeight: any;
    endHeight: any;
    skipCompression: any;
    folder: string;
};
