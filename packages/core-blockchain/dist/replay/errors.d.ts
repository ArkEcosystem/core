export declare class ReplayError extends Error {
    constructor(message: string);
}
export declare class FailedToReplayBlocksError extends ReplayError {
    constructor();
}
