"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
const core_transactions_1 = require("@arkecosystem/core-transactions");
class BusinessAlreadyRegisteredError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because wallet was already registered as a business.");
    }
}
exports.BusinessAlreadyRegisteredError = BusinessAlreadyRegisteredError;
class BusinessIsNotRegisteredError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because wallet is not a business.");
    }
}
exports.BusinessIsNotRegisteredError = BusinessIsNotRegisteredError;
class WalletIsNotBusinessError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because wallet is not a business.");
    }
}
exports.WalletIsNotBusinessError = WalletIsNotBusinessError;
class BusinessIsResignedError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because business is resigned.");
    }
}
exports.BusinessIsResignedError = BusinessIsResignedError;
class BridgechainAlreadyRegisteredError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because bridgechain is already registered.");
    }
}
exports.BridgechainAlreadyRegisteredError = BridgechainAlreadyRegisteredError;
class BridgechainIsNotRegisteredByWalletError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because bridgechain is not registered by wallet.");
    }
}
exports.BridgechainIsNotRegisteredByWalletError = BridgechainIsNotRegisteredByWalletError;
class BridgechainIsResignedError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because bridgechain is resigned.");
    }
}
exports.BridgechainIsResignedError = BridgechainIsResignedError;
class BridgechainsAreNotResignedError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because the business bridgechain(s) are not resigned.");
    }
}
exports.BridgechainsAreNotResignedError = BridgechainsAreNotResignedError;
class GenesisHashAlreadyRegisteredError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because genesis hash is already registered by another bridgechain.");
    }
}
exports.GenesisHashAlreadyRegisteredError = GenesisHashAlreadyRegisteredError;
class PortKeyMustBeValidPackageNameError extends core_transactions_1.Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because the package name(s) defined in ports is not valid.");
    }
}
exports.PortKeyMustBeValidPackageNameError = PortKeyMustBeValidPackageNameError;
//# sourceMappingURL=errors.js.map