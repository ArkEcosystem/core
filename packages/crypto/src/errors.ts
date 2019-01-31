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
    constructor() {
        super("Invalid BIP38 compression flag");
    }
}

export class InvalidBip38LengthError extends CryptoError {
    constructor() {
        super("Invalid BIP38 data length");
    }
}

export class InvalidBip38PrefixError extends CryptoError {
    constructor() {
        super("Invalid BIP38 prefix");
    }
}

export class InvalidBip38TypeError extends CryptoError {
    constructor() {
        super("Invalid BIP38 type");
    }
}

export class InvalidNetworkVersionError extends CryptoError {
    constructor() {
        super("Invalid network version");
    }
}

export class InvalidPrivateKeyLengthError extends CryptoError {
    constructor() {
        super("Invalid private key length");
    }
}

export class InvalidPublicKeyError extends CryptoError {
    constructor(value: string) {
        super(`publicKey '${value}' is invalid`);
    }
}

export class InvalidTransactionTypeError extends CryptoError {
    constructor(value: string) {
        super(`Type ${value} not supported.`);
    }
}

export class InvalidTransactionVersionError extends CryptoError {
    constructor(value: number) {
        super(`Version ${value} not supported.`);
    }
}

export class MaximumPaymentsCountExceededError extends CryptoError {
    constructor() {
        super("A maximum of 2258 outputs is allowed");
    }
}

export class MissingTransactionSignatureError extends CryptoError {
    constructor() {
        super("The transaction is not signed yet");
    }
}
