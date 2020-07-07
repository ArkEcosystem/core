// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class EntitySenderIsNotDelegateError extends Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because entity sender wallet is not a delegate.");
    }
}

export class EntityNameDoesNotMatchDelegateError extends Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because entity name does not match delegate name.");
    }
}
