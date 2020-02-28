import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export class TransactionAlreadyInPoolError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`Transaction ${transaction.id} is already in pool`, "ERR_DUPLICATE", transaction);
    }
}

export class TransactionExceedsMaximumByteSizeError extends Contracts.TransactionPool.PoolError {
    public readonly maxSize: number;

    public constructor(transaction: Interfaces.ITransaction, maxSize: number) {
        // ! should be "ERR_TO_LARGE" instead of "ERR_TOO_LARGE"
        super(`Transaction ${transaction.id} exceeds ${maxSize}b size limit`, "ERR_TOO_LARGE", transaction);
        this.maxSize = maxSize;
    }
}

export class TransactionHasExpiredError extends Contracts.TransactionPool.PoolError {
    public readonly expiredBlocksCount: number;

    public constructor(transaction: Interfaces.ITransaction, expiredBlocksCount: number) {
        super(`Transaction ${transaction.id} expired ${expiredBlocksCount} blocks ago`, "ERR_EXPIRED", transaction);
        this.expiredBlocksCount = expiredBlocksCount;
    }
}

export class TransactionFeeToLowError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`Transaction ${transaction.id} fee is to low to include in pool`, "ERR_LOW_FEE", transaction);
    }
}

export class SenderExceededMaximumTransactionCountError extends Contracts.TransactionPool.PoolError {
    public readonly maxCount: number;

    public constructor(transaction: Interfaces.ITransaction, maxCount: number) {
        super(`Transaction ${transaction.id} exceeds ${maxCount} count limit`, "ERR_EXCEEDS_MAX_COUNT", transaction);
        this.maxCount = maxCount;
    }
}

export class TransactionPoolFullError extends Contracts.TransactionPool.PoolError {
    public readonly required: Utils.BigNumber;

    public constructor(transaction: Interfaces.ITransaction, required: Utils.BigNumber) {
        const msg =
            `Transaction ${transaction.id} fee ${transaction.data.fee.toFixed()} ` +
            `is lower than ${required.toFixed()} already in pool`;
        super(msg, "ERR_POOL_FULL", transaction);
        this.required = required;
    }
}

export class TransactionFailedToApplyError extends Contracts.TransactionPool.PoolError {
    public readonly error: Error;

    public constructor(transaction: Interfaces.ITransaction, error: Error) {
        super(`Transaction ${transaction.id} cannot be applied: ${error.message}`, "ERR_APPLY", transaction);
        this.error = error;
    }
}

export class TransactionFailedToVerifyError extends Contracts.TransactionPool.PoolError {
    public constructor(transaction: Interfaces.ITransaction) {
        super(`Transaction ${transaction.id} didn't passed verification`, "ERR_BAD_DATA", transaction);
    }
}

export class TransactionFromFutureError extends Contracts.TransactionPool.PoolError {
    public secondsInFuture: number;

    public constructor(transaction: Interfaces.ITransaction, secondsInFuture: number) {
        super(`Transaction ${transaction.id} is ${secondsInFuture}s in future`, "ERR_FROM_FUTURE", transaction);
        this.secondsInFuture = secondsInFuture;
    }
}

export class TransactionFromWrongNetworkError extends Contracts.TransactionPool.PoolError {
    public currentNetwork: number;

    public constructor(transaction: Interfaces.ITransaction, currentNetwork: number) {
        super(
            `Transaction ${transaction.id} network ${transaction.data.network} doesn't match ${currentNetwork}`,
            "ERR_WRONG_NETWORK",
            transaction,
        );
        this.currentNetwork = currentNetwork;
    }
}
