export interface SnapshotService {
    dump(options: any): Promise<void>;
    restore(options: any): Promise<void>;
    rollbackByHeight(height: number): Promise<void>;
    rollbackByNumber(number: number): Promise<void>;
    truncate(): Promise<void>;
    verify(options: any): Promise<void>;
}
