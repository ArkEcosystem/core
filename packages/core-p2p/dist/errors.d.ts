export declare class P2PError extends Error {
    constructor(message: string);
}
export declare class PeerStatusResponseError extends P2PError {
    constructor(ip: string);
}
export declare class PeerPingTimeoutError extends P2PError {
    constructor(latency: number);
}
export declare class PeerVerificationFailedError extends P2PError {
    constructor();
}
export declare class MissingCommonBlockError extends P2PError {
    constructor();
}
