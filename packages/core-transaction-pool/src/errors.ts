import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export class DuplicateError extends Error implements Contracts.TransactionPool.DuplicateError {
    public readonly type = "ERR_DUPLICATE";
    public readonly transaction: Interfaces.ITransaction;

    public constructor(transaction: Interfaces.ITransaction) {
        super(`Transaction ${transaction.id} is already in pool`);
        this.transaction = transaction;
    }
}

export class ToLargeError extends Error implements Contracts.TransactionPool.ToLargeError {
    public readonly type = "ERR_TO_LARGE";
    public readonly transaction: Interfaces.ITransaction;
    public readonly maxSize: number;

    public constructor(transaction: Interfaces.ITransaction, maxSize: number) {
        super(`Transaction ${transaction.id} exceeds ${maxSize}b size limit`);
        this.transaction = transaction;
        this.maxSize = maxSize;
    }
}

export class ExpiredError extends Error implements Contracts.TransactionPool.ExpiredError {
    public readonly type = "ERR_EXPIRED";
    public readonly transaction: Interfaces.ITransaction;
    public readonly expiredBlocksCount: number;

    public constructor(transaction: Interfaces.ITransaction, expiredBlocksCount: number) {
        super(`Transaction ${transaction.id} expired ${expiredBlocksCount} blocks ago`);
        this.transaction = transaction;
        this.expiredBlocksCount = expiredBlocksCount;
    }
}

export class LowFeeError extends Error implements Contracts.TransactionPool.LowFeeError {
    public readonly type = "ERR_LOW_FEE";
    public readonly transaction: Interfaces.ITransaction;

    public constructor(transaction: Interfaces.ITransaction) {
        super(`Transaction ${transaction.id} fee is to low include in pool`);
        this.transaction = transaction;
    }
}

export class ExceedsMaxCountError extends Error implements Contracts.TransactionPool.ExceedsMaxCountError {
    public readonly type = "ERR_EXCEEDS_MAX_COUNT";
    public readonly transaction: Interfaces.ITransaction;
    public readonly maxCount: number;

    public constructor(transaction: Interfaces.ITransaction, maxCount: number) {
        super(`Transaction ${transaction.id} exceeds ${maxCount} count limit`);
        this.transaction = transaction;
        this.maxCount = maxCount;
    }
}

export class PoolFullError extends Error implements Contracts.TransactionPool.PoolFullError {
    public readonly type = "ERR_POOL_FULL";
    public readonly transaction: Interfaces.ITransaction;
    public readonly required: Utils.BigNumber;

    public constructor(transaction: Interfaces.ITransaction, required: Utils.BigNumber) {
        super(
            `Transaction ${transaction.id}` +
                ` fee ${transaction.data.fee.toFixed()} fee is lower than ${required.toFixed()} already in pool`,
        );
        this.transaction = transaction;
        this.required = required;
    }
}

export class ApplyError extends Error implements Contracts.TransactionPool.ApplyError {
    public readonly type = "ERR_APPLY";
    public readonly transaction: Interfaces.ITransaction;
    public readonly error: Error;

    public constructor(transaction: Interfaces.ITransaction, error: Error) {
        super(`Transaction ${transaction.id} cannot be applied: ${error.message}`);
        this.transaction = transaction;
        this.error = error;
    }
}

export class BadDataError extends Error implements Contracts.TransactionPool.BadDataError {
    public readonly type = "ERR_BAD_DATA";
    public readonly transaction: Interfaces.ITransaction;

    public constructor(transaction: Interfaces.ITransaction) {
        super(`Transaction ${transaction.id} didn't passed verification`);
        this.transaction = transaction;
    }
}
