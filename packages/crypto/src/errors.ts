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
        super(`Not implemented.`);
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

export class TransactionValidationError extends CryptoError {
    constructor(what: string) {
        super(what);
    }
}

export class TransactionVersionError extends CryptoError {
    constructor(given: number) {
        super(`Version ${given} not supported.`);
    }
}

export class TransactionTypeNotImplementedError extends CryptoError {
    constructor() {
        super(`Transaction type must be implemented in subclass.`);
    }
}

export class TransactionTypeNotRegisteredError extends CryptoError {
    constructor(given: number) {
        super(`Transaction type ${given} is not registered.`);
    }
}

export class TransactionAlreadyRegisteredError extends CryptoError {
    constructor(name: string) {
        super(`Transaction type ${name} is already registered.`);
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
        super(`Failed to apply transaction, because of insufficient balance.`);
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

export class SecondSignatureVerificationFailedError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the second signature could not be verified.`);
    }
}

export class EmptyUsernameDelegateRegistrationError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the username is empty.`);
    }
}

export class DelegateRegistrationError extends CryptoError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already has a registered username.`);
    }
}
