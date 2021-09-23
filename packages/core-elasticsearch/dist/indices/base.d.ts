/// <reference types="node" />
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
export declare abstract class Index {
    protected readonly chunkSize: number;
    protected readonly emitter: EventEmitter.EventEmitter;
    protected readonly logger: Logger.ILogger;
    protected readonly database: Database.IDatabaseService;
    constructor(chunkSize: number);
    abstract index(): void;
    abstract listen(): void;
    protected registerListener(method: "create" | "delete", event: string): void;
    protected createQuery(): any;
    protected bulkUpsert(rows: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    protected getIterations(): Promise<number>;
    protected countWithDatabase(): Promise<number>;
    private countWithElastic;
    private exists;
    private getReadQuery;
    private getUpsertQuery;
    private getType;
    private getIndex;
}
