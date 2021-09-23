"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
class ReplayError extends Error {
    constructor(message) {
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
exports.ReplayError = ReplayError;
class FailedToReplayBlocksError extends ReplayError {
    constructor() {
        super(`Failed to replay some blocks.`);
    }
}
exports.FailedToReplayBlocksError = FailedToReplayBlocksError;
//# sourceMappingURL=errors.js.map