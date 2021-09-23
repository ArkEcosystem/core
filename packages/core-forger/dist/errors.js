"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
class ForgerError extends Error {
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
exports.ForgerError = ForgerError;
class RelayCommunicationError extends ForgerError {
    constructor(endpoint, message) {
        super(`Request to ${endpoint} failed, because of '${message}'.`);
    }
}
exports.RelayCommunicationError = RelayCommunicationError;
class HostNoResponseError extends ForgerError {
    constructor(host) {
        super(`${host} didn't respond. Trying again later.`);
    }
}
exports.HostNoResponseError = HostNoResponseError;
//# sourceMappingURL=errors.js.map