export class WalletsError extends Error {
    public constructor(message: string) {
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
    public constructor(what: string) {
        super(`The wallet index is already registered: ${what}`);
    }
}

export class WalletIndexNotFoundError extends WalletsError {
    public constructor(what: string) {
        super(`The wallet index does not exist: ${what}`);
    }
}
