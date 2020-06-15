import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export class RetryTransactionError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`${transaction} cannot be added to pool, please retry`, "ERR_RETRY");
    }
}

export class TransactionAlreadyInPoolError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`${transaction} is already in pool`, "ERR_DUPLICATE");
    }
}

export class TransactionExceedsMaximumByteSizeError extends Contracts.TransactionPool.PoolError {
    public readonly maxSize: number;

    public constructor(transaction: Interfaces.ITransaction, maxSize: number) {
        super(
            `${transaction} exceeds size limit of ${AppUtils.pluralize("byte", maxSize, true)}`,
            "ERR_TOO_LARGE", // ! should be "ERR_TO_LARGE" instead of "ERR_TOO_LARGE"
        );
        this.maxSize = maxSize;
    }
}

export class TransactionHasExpiredError extends Contracts.TransactionPool.PoolError {
    public readonly expirationHeight: number;

    public constructor(transaction: Interfaces.ITransaction, expirationHeight: number) {
        super(`${transaction} expired at height ${expirationHeight}`, "ERR_EXPIRED");
        this.expirationHeight = expirationHeight;
    }
}

export class TransactionFeeToLowError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`${transaction} fee is to low to enter the pool`, "ERR_LOW_FEE");
    }
}

export class TransactionFeeToHighError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`${transaction} fee is to high to enter the pool`, "ERR_HIGH_FEE");
    }
}

export class SenderExceededMaximumTransactionCountError extends Contracts.TransactionPool.PoolError {
    public readonly maxCount: number;

    public constructor(transaction: Interfaces.ITransaction, maxCount: number) {
        super(
            `${transaction} exceeds sender's ${AppUtils.pluralize("transaction", maxCount, true)} count limit`,
            "ERR_EXCEEDS_MAX_COUNT",
        );
        this.maxCount = maxCount;
    }
}

export class TransactionPoolFullError extends Contracts.TransactionPool.PoolError {
    public readonly required: Utils.BigNumber;

    public constructor(transaction: Interfaces.ITransaction, required: Utils.BigNumber) {
        const msg =
            `${transaction} fee ${Utils.formatSatoshi(transaction.data.fee)} ` +
            `is lower than ${Utils.formatSatoshi(required)} already in pool`;
        super(msg, "ERR_POOL_FULL");
        this.required = required;
    }
}

export class TransactionFailedToApplyError extends Contracts.TransactionPool.PoolError {
    public readonly error: Error;

    public constructor(transaction: Interfaces.ITransaction, error: Error) {
        super(`${transaction} cannot be applied: ${error.message}`, "ERR_APPLY");
        this.error = error;
    }
}

export class TransactionFailedToVerifyError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`${transaction} didn't passed verification`, "ERR_BAD_DATA");
    }
}

export class TransactionFromFutureError extends Contracts.TransactionPool.PoolError {
    public secondsInFuture: number;

    public constructor(transaction: Interfaces.ITransaction, secondsInFuture: number) {
        super(`${transaction} is ${AppUtils.pluralize("second", secondsInFuture, true)} in future`, "ERR_FROM_FUTURE");
        this.secondsInFuture = secondsInFuture;
    }
}

export class TransactionFromWrongNetworkError extends Contracts.TransactionPool.PoolError {
    public currentNetwork: number;

    public constructor(transaction: Interfaces.ITransaction, currentNetwork: number) {
        super(
            `${transaction} network ${transaction.data.network} doesn't match node's network ${currentNetwork}`,
            "ERR_WRONG_NETWORK",
        );
        this.currentNetwork = currentNetwork;
    }
}

export class InvalidTransactionDataError extends Contracts.TransactionPool.PoolError {
    public constructor(reason: string) {
        super(`Invalid transaction data: ${reason}`, "ERR_BAD_DATA");
    }
}
