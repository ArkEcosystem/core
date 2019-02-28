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

export class TransactionSchemaAlreadyExistsError extends CryptoError {
    constructor(name: string) {
        super(`Schema ${name} is already registered.`);
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

export class InsufficientBalanceError extends CryptoError {
    constructor() {
        super(`Insufficient balance in the wallet.`);
    }
}

export class SenderWalletMismatchError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the public key does not match the wallet.`);
    }
}

export class UnexpectedSecondSignatureError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because wallet does not allow second signatures.`);
    }
}

export class UnexpectedMultiSignatureError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because multi signatures are currently not supported.`);
    }
}

export class InvalidSecondSignatureError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the second signature could not be verified.`);
    }
}

export class WalletUsernameEmptyError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the username is empty.`);
    }
}

export class WalletUsernameNotEmptyError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already has a registered username.`);
    }
}

export class WalletNoUsernameError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the wallet has no registered username.`);
    }
}

export class SecondSignatureAlreadyRegisteredError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because second signature is already enabled.`);
    }
}

export class AlreadyVotedError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already voted.`);
    }
}

export class NoVoteError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the wallet has not voted.`);
    }
}

export class UnvoteMismatchError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the wallet vote does not match.`);
    }
}

export class MultiSignatureAlreadyRegisteredError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because multi signature is already enabled.`);
    }
}

export class MultiSignatureMinimumKeysError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because too few keys were provided.`);
    }
}

export class MultiSignatureKeyCountMismatchError extends CryptoError {
    constructor() {
        super(
            `Failed to apply transaction, because the number of provided keys does not match the number of signatures.`,
        );
    }
}

export class InvalidMultiSignatureError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the multi signature could not be verified.`);
    }
}
