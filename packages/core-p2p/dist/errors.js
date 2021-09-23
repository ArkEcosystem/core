"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
class P2PError extends Error {
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
exports.P2PError = P2PError;
class PeerStatusResponseError extends P2PError {
    constructor(ip) {
        super(`Failed to retrieve status from peer ${ip}.`);
    }
}
exports.PeerStatusResponseError = PeerStatusResponseError;
class PeerPingTimeoutError extends P2PError {
    constructor(latency) {
        super(`Ping timeout (${latency} ms)`);
    }
}
exports.PeerPingTimeoutError = PeerPingTimeoutError;
class PeerVerificationFailedError extends P2PError {
    constructor() {
        super("Peer verification failed.");
    }
}
exports.PeerVerificationFailedError = PeerVerificationFailedError;
class MissingCommonBlockError extends P2PError {
    constructor() {
        super("Couldn't find any common blocks.");
    }
}
exports.MissingCommonBlockError = MissingCommonBlockError;
//# sourceMappingURL=errors.js.map