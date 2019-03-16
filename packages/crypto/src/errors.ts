// tslint:disable:max-classes-per-file

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "message", {
            enumerable: false,
            value: message,
        });

        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });

        Error.captureStackTrace(this, this.constructor);
    }
}

export class Bip38CompressionError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected flag to be ${expected}, but got ${given}.`);
    }
}

export class Bip38LengthError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected length to be ${expected}, but got ${given}.`);
    }
}

export class Bip38PrefixError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected prefix to be ${expected}, but got ${given}.`);
    }
}

export class Bip38TypeError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected type to be ${expected}, but got ${given}.`);
    }
}

export class NetworkVersionError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected version to be ${expected}, but got ${given}.`);
    }
}

export class NotImplementedError extends CryptoError {
    constructor() {
        super(`Feature is not available.`);
    }
}

export class PrivateKeyLengthError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected length to be ${expected}, but got ${given}.`);
    }
}

export class PublicKeyError extends CryptoError {
    constructor(given: string) {
        super(`Expected ${given} to be a valid public key.`);
    }
}

export class TransactionTypeError extends CryptoError {
    constructor(given: string) {
        super(`Type ${given} not supported.`);
    }
}

export class MalformedTransactionBytesError extends CryptoError {
    constructor() {
        super(`Failed to deserialize transaction, because the bytes are malformed.`);
    }
}

export class TransactionSchemaError extends CryptoError {
    constructor(what: string) {
        super(what);
    }
}

export class TransactionVersionError extends CryptoError {
    constructor(given: number) {
        super(`Version ${given} not supported.`);
    }
}

export class UnkownTransactionError extends CryptoError {
    constructor(given: number) {
        super(`Transaction type ${given} is not registered.`);
    }
}

export class TransactionAlreadyRegisteredError extends CryptoError {
    constructor(name: string) {
        super(`Transaction type ${name} is already registered.`);
    }
}

export class TransactionTypeInvalidRangeError extends CryptoError {
    constructor(given: number) {
        super(`Custom transaction type must be in the range 100-255 (${given}).`);
    }
}

export class MissingMilestoneFeeError extends CryptoError {
    constructor(name: string) {
        super(`Missing milestone fee for '${name}'.`);
    }
}

export class MaximumPaymentCountExceededError extends CryptoError {
    constructor(given: number) {
        super(`Expected a maximum of 2258 payments, but got ${given}.`);
    }
}

export class MissingTransactionSignatureError extends CryptoError {
    constructor() {
        super(`Expected the transaction to be signed.`);
    }
}

export class BlockSchemaError extends CryptoError {
    constructor(what: string) {
        super(what);
    }
}

export class PreviousBlockIdFormatError extends CryptoError {
    constructor(thisBlockHeight: number, previousBlockId: string) {
        super(
            `The config denotes that the block at height ${thisBlockHeight - 1} ` +
                `must use full SHA256 block id, but the next block (at ${thisBlockHeight}) ` +
                `contains previous block id "${previousBlockId}"`,
        );
    }
}
