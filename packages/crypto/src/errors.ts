export class CryptoError extends Error {
    public constructor(message: string, options?: { cause?: Error }) {
        super(message);

        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });

        if (options?.cause) {
            // Error causes are available starting from node v16.9.0
            // - TypeScript Error.constructor definition doesn't yet include it.
            // - Jest doesn't print error.cause stack trace (new stack-tools package is in development).
            // - Contracts.ILogger needs to treat error and error.cause specially.
            //
            // Until then message and stack have to be manipulated instead of simply:
            //   super(message, options)

            this.message = `${message} ${options.cause.message}`;

            if (options.cause.stack) {
                this.stack = [`${this.name}: ${this.message}`, ...options.cause.stack.split("\n").slice(1)].join("\n");
            }

            Object.defineProperty(this, "cause", {
                enumerable: false,
                value: options.cause,
            });
        }
    }
}

export class Bip38CompressionError extends CryptoError {
    public constructor(expected: string | number, given: string | number) {
        super(`Expected flag to be ${expected}, but got ${given}.`);
    }
}

export class Bip38LengthError extends CryptoError {
    public constructor(expected: string | number, given: string | number) {
        super(`Expected length to be ${expected}, but got ${given}.`);
    }
}

export class Bip38PrefixError extends CryptoError {
    public constructor(expected: string | number, given: string | number) {
        super(`Expected prefix to be ${expected}, but got ${given}.`);
    }
}

export class Bip38TypeError extends CryptoError {
    public constructor(expected: string | number, given: string | number) {
        super(`Expected type to be ${expected}, but got ${given}.`);
    }
}

export class NetworkVersionError extends CryptoError {
    public constructor(expected: string | number, given: string | number) {
        super(`Expected version to be ${expected}, but got ${given}.`);
    }
}

export class NotImplemented extends CryptoError {
    public constructor() {
        super(`Feature is not available.`);
    }
}

export class PrivateKeyLengthError extends CryptoError {
    public constructor(expected: string | number, given: string | number) {
        super(`Expected length to be ${expected}, but got ${given}.`);
    }
}

export class PublicKeyError extends CryptoError {
    public constructor(given: string) {
        super(`Expected ${given} to be a valid public key.`);
    }
}

export class AddressNetworkError extends CryptoError {
    public constructor(what: string) {
        super(what);
    }
}

export class TransactionTypeError extends CryptoError {
    public constructor(given: string) {
        super(`Type ${given} not supported.`);
    }
}

export class InvalidTransactionBytesError extends CryptoError {
    public constructor(message: string) {
        super(`Failed to deserialize transaction, encountered invalid bytes: ${message}`);
    }
}

export class TransactionSchemaError extends CryptoError {
    public constructor(what: string) {
        super(what);
    }
}

export class TransactionVersionError extends CryptoError {
    public constructor(given: number) {
        super(`Version ${given} not supported.`);
    }
}

export class UnkownTransactionError extends CryptoError {
    public constructor(given: string) {
        super(`Unknown transaction type: ${given}`);
    }
}

export class TransactionAlreadyRegisteredError extends CryptoError {
    public constructor(name: string) {
        super(`Transaction type ${name} is already registered.`);
    }
}

export class TransactionKeyAlreadyRegisteredError extends CryptoError {
    public constructor(name: string) {
        super(`Transaction key ${name} is already registered.`);
    }
}

export class TransactionVersionAlreadyRegisteredError extends CryptoError {
    public constructor(name: string, version: number) {
        super(`Transaction type ${name} is already registered in version ${version}.`);
    }
}

export class CoreTransactionTypeGroupImmutableError extends CryptoError {
    public constructor() {
        super(`The Core transaction type group is immutable.`);
    }
}

export class MissingMilestoneFeeError extends CryptoError {
    public constructor(name: string) {
        super(`Missing milestone fee for '${name}'.`);
    }
}

export class MaximumPaymentCountExceededError extends CryptoError {
    public constructor(limit: number) {
        super(`Number of payments exceeded the allowed maximum of ${limit}.`);
    }
}

export class MinimumPaymentCountSubceededError extends CryptoError {
    public constructor() {
        super(`Number of payments subceeded the required minimum of 2.`);
    }
}

export class VendorFieldLengthExceededError extends CryptoError {
    public constructor(limit: number) {
        super(`Length of vendor field exceeded the allowed maximum ${limit}.`);
    }
}

export class MissingTransactionSignatureError extends CryptoError {
    public constructor() {
        super(`Expected the transaction to be signed.`);
    }
}

export class BlockSchemaError extends CryptoError {
    public constructor(height: number, what: string) {
        super(`Height (${height}): ${what}`);
    }
}

export class PreviousBlockIdFormatError extends CryptoError {
    public constructor(thisBlockHeight: number, previousBlockId: string) {
        super(
            `The config denotes that the block at height ${thisBlockHeight - 1} ` +
                `must use full SHA256 block id, but the next block (at ${thisBlockHeight}) ` +
                `contains previous block id "${previousBlockId}"`,
        );
    }
}

export class InvalidMilestoneConfigurationError extends CryptoError {
    public constructor(message: string) {
        super(message);
    }
}

export class InvalidMultiSignatureAssetError extends CryptoError {
    public constructor() {
        super(`The multi signature asset is invalid.`);
    }
}

export class DuplicateParticipantInMultiSignatureError extends CryptoError {
    public constructor() {
        super(`Invalid multi signature, because duplicate participant found.`);
    }
}
