// tslint:disable:max-classes-per-file

export class ExtendableError extends Error {
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

export class CryptoError extends ExtendableError {}

export class InvalidBip38CompressionError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected flag to be ${expected}, but got ${given}.`);
    }
}

export class InvalidBip38LengthError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected length to be ${expected}, but got ${given}.`);
    }
}

export class InvalidBip38PrefixError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected prefix to be ${expected}, but got ${given}.`);
    }
}

export class InvalidBip38TypeError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected type to be ${expected}, but got ${given}.`);
    }
}

export class InvalidNetworkVersionError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected version to be ${expected}, but got ${given}.`);
    }
}

export class InvalidPrivateKeyLengthError extends CryptoError {
    constructor(expected: string | number, given: string | number) {
        super(`Expected length to be ${expected}, but got ${given}.`);
    }
}

export class InvalidPublicKeyError extends CryptoError {
    constructor(given: string) {
        super(`Expected ${given} to be a valid public key.`);
    }
}

export class InvalidTransactionTypeError extends CryptoError {
    constructor(given: string) {
        super(`Type ${given} not supported.`);
    }
}

export class InvalidTransactionVersionError extends CryptoError {
    constructor(given: number) {
        super(`Version ${given} not supported.`);
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
