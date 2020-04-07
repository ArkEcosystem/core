export interface SnapshotService {
    dump(): Promise<void>;
    restore(): Promise<void>;
    rollbackByHeight(height: number, backupTransactions: boolean): Promise<void>;
    rollbackByNumber(number: number, backupTransactions: boolean): Promise<void>;
    truncate(): Promise<void>;
    verify(): Promise<void>;
    test(): Promise<void>;
}
