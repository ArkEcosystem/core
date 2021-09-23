import SocketCluster from "socketcluster";
declare class PayloadProcessor {
    private payloadDatabasePath;
    private databaseSize;
    private payloadDatabase;
    private payloadQueue;
    private payloadOverflowQueue;
    private maxPayloadQueueSize;
    private maxPayloadOverflowQueueSize;
    private listener;
    constructor();
    inject(socketCluster: SocketCluster): void;
    private addPayload;
    private totalPayloads;
    private processPayloads;
    private getNextPayload;
}
export declare const payloadProcessor: PayloadProcessor;
export {};
