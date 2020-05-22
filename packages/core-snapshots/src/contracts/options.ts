export interface DumpOptions {
    network: string;
    skipCompression?: boolean;
    codec?: string;
    start?: number;
    end?: number;
}

export interface RestoreOptions {
    truncate: boolean;
}
