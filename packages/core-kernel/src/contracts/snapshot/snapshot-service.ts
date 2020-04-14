export interface SnapshotService {
    dump(options: any): Promise<void>;
    restore(options: any): Promise<void>;
    rollbackByHeight(height: number, backupTransactions: boolean): Promise<void>;
    rollbackByNumber(number: number, backupTransactions: boolean): Promise<void>;
    truncate(): Promise<void>;
    verify(options: any): Promise<void>;
    test(options: any): Promise<void>;
}
