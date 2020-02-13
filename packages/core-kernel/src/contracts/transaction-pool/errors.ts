import { Interfaces, Utils } from "@arkecosystem/crypto";

export interface DuplicateError extends Error {
    type: "ERR_DUPLICATE";
    transaction: Interfaces.ITransaction;
    message: string;
}

export interface ToLargeError extends Error {
    type: "ERR_TO_LARGE";
    transaction: Interfaces.ITransaction;
    maxSize: number;
    message: string;
}

export interface ExpiredError extends Error {
    type: "ERR_EXPIRED";
    transaction: Interfaces.ITransaction;
    expiredBlocksCount: number;
    message: string;
}

export interface LowFeeError extends Error {
    type: "ERR_LOW_FEE";
    transaction: Interfaces.ITransaction;
    message: string;
}

export interface ExceedsMaxCountError extends Error {
    type: "ERR_EXCEEDS_MAX_COUNT";
    transaction: Interfaces.ITransaction;
    maxCount: number;
    message: string;
}

export interface PoolFullError extends Error {
    type: "ERR_POOL_FULL";
    transaction: Interfaces.ITransaction;
    message: string;
    required: Utils.BigNumber;
}

export interface ApplyError extends Error {
    type: "ERR_APPLY";
    transaction: Interfaces.ITransaction;
    error: Error;
    message: string;
}

export interface BadDataError extends Error {
    type: "ERR_BAD_DATA";
    transaction: Interfaces.ITransaction;
    message: string;
}

export type PoolError =
    | DuplicateError
    | ToLargeError
    | ExpiredError
    | LowFeeError
    | ExceedsMaxCountError
    | PoolFullError
    | ApplyError
    | BadDataError;
