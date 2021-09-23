"use strict";
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
class WalletsError extends Error {
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
exports.WalletsError = WalletsError;
class WalletIndexAlreadyRegisteredError extends WalletsError {
    constructor(what) {
        super(`The wallet index is already registered: ${what}`);
    }
}
exports.WalletIndexAlreadyRegisteredError = WalletIndexAlreadyRegisteredError;
class WalletIndexNotFoundError extends WalletsError {
    constructor(what) {
        super(`The wallet index does not exist: ${what}`);
    }
}
exports.WalletIndexNotFoundError = WalletIndexNotFoundError;
//# sourceMappingURL=errors.js.map