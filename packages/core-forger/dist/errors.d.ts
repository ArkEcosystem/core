export declare class ForgerError extends Error {
    constructor(message: string);
}
export declare class RelayCommunicationError extends ForgerError {
    constructor(endpoint: string, message: string);
}
export declare class HostNoResponseError extends ForgerError {
    constructor(host: string);
}
