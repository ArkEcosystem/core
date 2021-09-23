declare class Database {
    private database;
    private table;
    connect(file: string): void;
    get<T = any>(key: string): Promise<T>;
    set<T = any>(key: string, value: T): Promise<void>;
    private getKeyPrefix;
}
export declare const database: Database;
export {};
