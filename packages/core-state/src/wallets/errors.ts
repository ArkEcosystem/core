// tslint:disable:max-classes-per-file

export class WalletsError extends Error {
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

export class WalletIndexAlreadyRegisteredError extends WalletsError {
    constructor(what: string) {
        super(`The wallet index is already registered: ${what}`);
    }
}

export class WalletIndexNotFoundError extends WalletsError {
    constructor(what: string) {
        super(`The wallet index does not exist: ${what}`);
    }
}
