import { Errors } from "@arkecosystem/core-transactions";
export declare class BusinessAlreadyRegisteredError extends Errors.TransactionError {
    constructor();
}
export declare class BusinessIsNotRegisteredError extends Errors.TransactionError {
    constructor();
}
export declare class WalletIsNotBusinessError extends Errors.TransactionError {
    constructor();
}
export declare class BusinessIsResignedError extends Errors.TransactionError {
    constructor();
}
export declare class BridgechainAlreadyRegisteredError extends Errors.TransactionError {
    constructor();
}
export declare class BridgechainIsNotRegisteredByWalletError extends Errors.TransactionError {
    constructor();
}
export declare class BridgechainIsResignedError extends Errors.TransactionError {
    constructor();
}
export declare class BridgechainsAreNotResignedError extends Errors.TransactionError {
    constructor();
}
export declare class GenesisHashAlreadyRegisteredError extends Errors.TransactionError {
    constructor();
}
export declare class PortKeyMustBeValidPackageNameError extends Errors.TransactionError {
    constructor();
}
