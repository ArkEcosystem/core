import { Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import {
    InvalidTransactionDataError,
    RetryTransactionError,
    SenderExceededMaximumTransactionCountError,
    TransactionAlreadyInPoolError,
    TransactionExceedsMaximumByteSizeError,
    TransactionFailedToApplyError,
    TransactionFailedToVerifyError,
    TransactionFeeToLowError,
    TransactionFromFutureError,
    TransactionFromWrongNetworkError,
    TransactionHasExpiredError,
    TransactionPoolFullError,
} from "../../../packages/core-transaction-pool/src/errors";

Managers.configManager.getMilestone().aip11 = true;
const transaction = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("900")
    .sign("sender's secret")
    .build();

// DLaFiYprzZU2DwV1KPYcDfPr2MJFLSznU7#1 918fa01e Transfer v2
// console.log(String(transaction));

test("RetryTransactionError", () => {
    const error = new RetryTransactionError(transaction);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_RETRY");
    expect(error.message).toBe(`${transaction} cannot be added to pool, please retry`);
});

test("TransactionAlreadyInPoolError", () => {
    const error = new TransactionAlreadyInPoolError(transaction);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_DUPLICATE");
    expect(error.message).toBe(`${transaction} is already in pool`);
});

test("TransactionExceedsMaximumByteSizeError", () => {
    const error = new TransactionExceedsMaximumByteSizeError(transaction, 1024);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_TOO_LARGE");
    expect(error.message).toBe(`${transaction} exceeds size limit of 1024 bytes`);
});

test("TransactionHasExpiredError", () => {
    const error = new TransactionHasExpiredError(transaction, 100);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_EXPIRED");
    expect(error.message).toBe(`${transaction} expired at height 100`);
});

test("TransactionFeeToLowError", () => {
    const error = new TransactionFeeToLowError(transaction);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_LOW_FEE");
    expect(error.message).toBe(`${transaction} fee is to low to enter the pool`);
});

test("SenderExceededMaximumTransactionCountError", () => {
    const error = new SenderExceededMaximumTransactionCountError(transaction, 1);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_EXCEEDS_MAX_COUNT");
    expect(error.message).toBe(`${transaction} exceeds sender's 1 transaction count limit`);
});

test("TransactionPoolFullError", () => {
    const error = new TransactionPoolFullError(transaction, new Utils.BigNumber(1000));

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_POOL_FULL");
    expect(error.message).toBe(`${transaction} fee 0.000009 DѦ is lower than 0.00001 DѦ already in pool`);
});

test("TransactionFailedToApplyError", () => {
    const error = new TransactionFailedToApplyError(transaction, new Error("Something went horribly wrong"));

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_APPLY");
    expect(error.message).toBe(`${transaction} cannot be applied: Something went horribly wrong`);
});

test("TransactionFailedToVerifyError", () => {
    const error = new TransactionFailedToVerifyError(transaction);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_BAD_DATA");
    expect(error.message).toBe(`${transaction} didn't passed verification`);
});

test("TransactionFromFutureError", () => {
    const error = new TransactionFromFutureError(transaction, 1);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_FROM_FUTURE");
    expect(error.message).toBe(`${transaction} is 1 second in future`);
});

test("TransactionFromWrongNetworkError", () => {
    const error = new TransactionFromWrongNetworkError(transaction, 23);

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_WRONG_NETWORK");
    expect(error.message).toBe(`${transaction} network 30 doesn't match node's network 23`);
});

test("InvalidTransactionDataError", () => {
    const error = new InvalidTransactionDataError("Version 1 not supported");

    expect(error).toBeInstanceOf(Contracts.TransactionPool.PoolError);
    expect(error.type).toBe("ERR_BAD_DATA");
    expect(error.message).toBe("Invalid transaction data: Version 1 not supported");
});
