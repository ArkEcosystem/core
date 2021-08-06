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
        super(`Extracted package is missing or have invalid package.json.`);
    }
}

export class MissingPackageFolder extends SourceError {
    public constructor() {
        super(`Compressed file doesn't contain required package folder`);
    }
}

export class AlreadyInstalled extends SourceError {
    public constructor(packageName: string) {
        super(`Package ${packageName} is already installed.`);
    }
}