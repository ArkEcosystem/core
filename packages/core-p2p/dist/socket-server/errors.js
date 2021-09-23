"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
class ServerError extends Error {
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
exports.ServerError = ServerError;
class InvalidBlockReceivedError extends ServerError {
    constructor(block) {
        super(`Received block ${block.id} at height ${block.height} failed to be verified.`);
    }
}
exports.InvalidBlockReceivedError = InvalidBlockReceivedError;
class InvalidTransactionsError extends ServerError {
    constructor() {
        super("The payload contains invalid transaction.");
    }
}
exports.InvalidTransactionsError = InvalidTransactionsError;
class TooManyTransactionsError extends ServerError {
    constructor(block) {
        super(`Received block ${block.id} at height ${block.height} contained too many transactions (${block.numberOfTransactions}).`);
    }
}
exports.TooManyTransactionsError = TooManyTransactionsError;
class UnchainedBlockError extends ServerError {
    constructor(lastHeight, nextHeight) {
        super(`Last received block ${nextHeight} cannot be chained to ${lastHeight}.`);
    }
}
exports.UnchainedBlockError = UnchainedBlockError;
//# sourceMappingURL=errors.js.map