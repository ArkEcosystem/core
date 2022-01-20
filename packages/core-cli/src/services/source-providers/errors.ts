export class SourceError extends Error {
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

export class InvalidPackageJson extends SourceError {
    public constructor() {
        super(`Missing or invalid package.json in extracted package.`);
    }
}

export class MissingPackageFolder extends SourceError {
    public constructor() {
        super(`Compressed file doesn't contain required package folder`);
    }
}
