export interface SnapshotService {
    dump(options: DumpOptions): Promise<void>;
    restore(options: RestoreOptions): Promise<void>;
    rollbackByHeight(height: number): Promise<void>;
    rollbackByNumber(number: number): Promise<void>;
    truncate(): Promise<void>;
    verify(options: VerifyOptions): Promise<void>;
}

export interface DumpOptions {
    network: string;
    codec?: string;
    skipCompression?: boolean;
    start?: number;
    end?: number;
}

export interface RestoreOptions {
    network: string;
    blocks: string;
    truncate?: boolean;
    verify?: boolean;
}

export interface VerifyOptions {
    network: string;
    blocks: string;
}
