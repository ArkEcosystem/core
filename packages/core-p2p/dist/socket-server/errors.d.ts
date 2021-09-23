import { Interfaces } from "@arkecosystem/crypto";
export declare class ServerError extends Error {
    constructor(message: string);
}
export declare class InvalidBlockReceivedError extends ServerError {
    constructor(block: Interfaces.IBlockData);
}
export declare class InvalidTransactionsError extends ServerError {
    constructor();
}
export declare class TooManyTransactionsError extends ServerError {
    constructor(block: Interfaces.IBlockData);
}
export declare class UnchainedBlockError extends ServerError {
    constructor(lastHeight: number, nextHeight: number);
}
