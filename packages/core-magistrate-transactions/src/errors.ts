// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class BusinessAlreadyRegisteredError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet was already registered as a business.`);
    }
}

export class BusinessIsNotRegisteredError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet is not a business.`);
    }
}

export class WalletIsNotBusinessError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet is not a business.`);
    }
}

export class BusinessIsResignedError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because business is resigned`);
    }
}

// export class BridgechainIsNotRegisteredError extends Errors.TransactionError {
//     public constructor() {
//         super(`Failed to apply transaction, because bridgechain is not registered.`);
//     }
// }

export class BridgechainAlreadyRegisteredError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bridgechain is already registered.`);
    }
}

export class BridgechainIsNotRegisteredByWalletError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bridgechain is not registered by wallet.`);
    }
}

export class BridgechainIsResignedError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bridgechain is resigned.`);
    }
}

export class StaticFeeMismatchError extends Errors.TransactionError {
    public constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}

export class BridgechainsAreNotResignedError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the business bridgechain(s) are not resigned.");
    }
}

export class GenesisHashAlreadyRegisteredError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because genesis hash is already registered by another bridgechain.`);
    }
}

export class PortKeyMustBeValidPackageNameError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the package name(s) defined in ports is not valid.");
    }
}

export class EntityAlreadyRegisteredError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the entity is already registered for the wallet.");
    }
}

export class EntityNameAlreadyRegisteredError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the entity name is already registered.");
    }
}

export class EntityNotRegisteredError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the entity is not registered for the wallet.");
    }
}

export class EntityAlreadyResignedError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the entity is already resigned for the wallet.");
    }
}

export class EntityWrongTypeError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the entity asset type does not match the wallet one.");
    }
}

export class EntityWrongSubTypeError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because the entity asset subtype does not match the wallet one.");
    }
}

export class EntitySenderIsNotDelegateError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because entity sender wallet is not a delegate.");
    }
}

export class EntityNameDoesNotMatchDelegateError extends Errors.TransactionError {
    public constructor() {
        super("Failed to apply transaction, because entity name does not match delegate name.");
    }
}
