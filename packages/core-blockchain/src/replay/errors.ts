// tslint:disable:max-classes-per-file

export class ReplayError extends Error {
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

export class FailedToReplayBlocksError extends ReplayError {
    constructor() {
        super(`Failed to replay some blocks.`);
    }
}
