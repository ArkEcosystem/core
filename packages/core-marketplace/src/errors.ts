// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class BusinessRegistrationAssetError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because name and websiteAddress are empty.`);
    }
}

export class BusinessIsNotRegisteredError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because wallet is not a business.`);
    }
}

export class BridgechainRegistrationAssetError extends Errors.TransactionError {
    constructor() {
        super(`Incomplete bridgechain registration asset.`);
    }
}

export class WalletIsNotBusinessError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply bridgechain transaction, because wallet is not a business.`);
    }
}

export class BusinessIsResignedError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because business is resigned`);
    }
}

export class BridgechainIsNotRegisteredError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because bridgechain is not registered error.`);
    }
}

export class BridgechainIsResignedError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because bridgechain is resigned error.`);
    }
}
