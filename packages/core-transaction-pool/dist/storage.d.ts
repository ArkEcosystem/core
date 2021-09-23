import { Interfaces } from "@arkecosystem/crypto";
export declare class Storage {
    private readonly table;
    private database;
    connect(file: string): void;
    disconnect(): void;
    bulkAdd(data: Interfaces.ITransaction[]): void;
    bulkRemoveById(ids: string[]): void;
    loadAll(): Interfaces.ITransaction[];
    deleteAll(): void;
}
