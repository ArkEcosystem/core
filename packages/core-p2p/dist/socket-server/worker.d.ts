import SCWorker from "socketcluster/scworker";
export declare class Worker extends SCWorker {
    private config;
    private handlers;
    private ipLastError;
    private rateLimiter;
    private rateLimitedEndpoints;
    run(): Promise<void>;
    private loadHandlers;
    private loadConfiguration;
    private loadRateLimitedEndpoints;
    private getRateLimitedEndpoints;
    private handlePayload;
    private hasAdditionalProperties;
    private setErrorForIpAndDestroy;
    private handleConnection;
    private handleSocket;
    private handleEmit;
    private log;
    private sendToMasterAsync;
}
