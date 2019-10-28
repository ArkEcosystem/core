// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class BusinessAlreadyRegisteredError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because wallet was already registered as a business.`);
    }
}

export class BusinessIsNotRegisteredError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because wallet is not a business.`);
    }
}

export class WalletIsNotBusinessError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because wallet is not a business.`);
    }
}

export class BusinessIsResignedError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because business is resigned.`);
    }
}

export class BridgechainAlreadyRegisteredError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because bridgechain is already registered.`);
    }
}

export class BridgechainIsNotRegisteredError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because bridgechain is not registered.`);
    }
}

export class BridgechainIsNotRegisteredByWalletError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because bridgechain is not registered by wallet.`);
    }
}

export class BridgechainIsResignedError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because bridgechain is resigned.`);
    }
}
