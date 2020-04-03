export interface SnapshotService {
    dump(): Promise<void>;
    restore(): Promise<void>;
    rollback(): Promise<void>;
    truncate(): Promise<void>;
    verify(): Promise<void>;
}
