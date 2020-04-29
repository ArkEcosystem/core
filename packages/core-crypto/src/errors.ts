import { Errors } from "@arkecosystem/crypto";

export class TransactionTypeError extends Errors.CryptoError {
    public constructor(given: string) {
        super(`Type ${given} not supported.`);
    }
}

export class InvalidTransactionBytesError extends Errors.CryptoError {
    public constructor(message: string) {
        super(`Failed to deserialize transaction, encountered invalid bytes: ${message}`);
    }
}

export class TransactionSchemaError extends Errors.CryptoError {
    public constructor(what: string) {
        super(what);
    }
}

export class TransactionVersionError extends Errors.CryptoError {
    public constructor(given: number) {
        super(`Version ${given} not supported.`);
    }
}

export class UnkownTransactionError extends Errors.CryptoError {
    public constructor(given: string) {
        super(`Unknown transaction type: ${given}`);
    }
}

export class TransactionAlreadyRegisteredError extends Errors.CryptoError {
    public constructor(name: string) {
        super(`Transaction type ${name} is already registered.`);
    }
}

export class TransactionKeyAlreadyRegisteredError extends Errors.CryptoError {
    public constructor(name: string) {
        super(`Transaction key ${name} is already registered.`);
    }
}

export class TransactionVersionAlreadyRegisteredError extends Errors.CryptoError {
    public constructor(name: string, version: number) {
        super(`Transaction type ${name} is already registered in version ${version}.`);
    }
}

export class CoreTransactionTypeGroupImmutableError extends Errors.CryptoError {
    public constructor() {
        super(`The Core transaction type group is immutable.`);
    }
}

export class MissingMilestoneFeeError extends Errors.CryptoError {
    public constructor(name: string) {
        super(`Missing milestone fee for '${name}'.`);
    }
}

export class MaximumPaymentCountExceededError extends Errors.CryptoError {
    public constructor(limit: number) {
        super(`Number of payments exceeded the allowed maximum of ${limit}.`);
    }
}

export class MinimumPaymentCountSubceededError extends Errors.CryptoError {
    public constructor() {
        super(`Number of payments subceeded the required minimum of 2.`);
    }
}

export class VendorFieldLengthExceededError extends Errors.CryptoError {
    public constructor(limit: number) {
        super(`Length of vendor field exceeded the allowed maximum ${limit}.`);
    }
}

export class MissingTransactionSignatureError extends Errors.CryptoError {
    public constructor() {
        super(`Expected the transaction to be signed.`);
    }
}

export class BlockSchemaError extends Errors.CryptoError {
    public constructor(height: number, what: string) {
        super(`Height (${height}): ${what}`);
    }
}

export class PreviousBlockIdFormatError extends Errors.CryptoError {
    public constructor(thisBlockHeight: number, previousBlockId: string) {
        super(
            `The config denotes that the block at height ${thisBlockHeight - 1} ` +
                `must use full SHA256 block id, but the next block (at ${thisBlockHeight}) ` +
                `contains previous block id "${previousBlockId}"`,
        );
    }
}

export class DuplicateParticipantInMultiSignatureError extends Errors.CryptoError {
    public constructor() {
        super(`Invalid multi signature, because duplicate participant found.`);
    }
}
