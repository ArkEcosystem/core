// tslint:disable:max-classes-per-file

export class TransactionError extends Error {
    constructor(message: string) {
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

export class NotImplementedError extends TransactionError {
    constructor() {
        super(`Feature is not available.`);
    }
}

export class TransactionHandlerAlreadyRegisteredError extends TransactionError {
    constructor(type: number) {
        super(`Transaction service for type ${type} is already registered.`);
    }
}

export class InvalidTransactionTypeError extends TransactionError {
    constructor(type: number) {
        super(`Transaction type ${type} does not exist.`);
    }
}

export class InsufficientBalanceError extends TransactionError {
    constructor() {
        super(`Insufficient balance in the wallet.`);
    }
}

export class SenderWalletMismatchError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the public key does not match the wallet.`);
    }
}

export class UnexpectedSecondSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because wallet does not allow second signatures.`);
    }
}

export class UnexpectedMultiSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because multi signatures are currently not supported.`);
    }
}

export class InvalidSecondSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the second signature could not be verified.`);
    }
}

export class WalletUsernameEmptyError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the username is empty.`);
    }
}

export class WalletUsernameNotEmptyError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already has a registered username.`);
    }
}

export class WalletNoUsernameError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet has no registered username.`);
    }
}

export class WalletUsernameAlreadyRegisteredError extends TransactionError {
    constructor(username: string) {
        super(`Failed to apply transaction, because the username '${username}' is already registered.`);
    }
}

export class WalletUsernameMismatchError extends TransactionError {
    constructor(walletUsername: string, transactionUsername: string) {
        super(
            `Failed to apply transaction, because the wallet username '${walletUsername}' ` +
            `differs from the transaction username '${transactionUsername}'.`
        );
    }
}

export class SecondSignatureAlreadyRegisteredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because second signature is already enabled.`);
    }
}
export class NotSupportedForMultiSignatureWalletError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because multi signature is enabled.`);
    }
}

export class AlreadyVotedError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already voted.`);
    }
}

export class NoVoteError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet has not voted.`);
    }
}

export class UnvoteMismatchError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet vote does not match.`);
    }
}

export class VotedForNonDelegateError extends TransactionError {
    constructor(vote: string) {
        super(`Failed to apply transaction, because only delegates can be voted.`);
    }
}

export class MultiSignatureAlreadyRegisteredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because multi signature is already enabled.`);
    }
}

export class InvalidMultiSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the multi signature could not be verified.`);
    }
}

export class MultiSignatureMinimumKeysError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because too few keys were provided.`);
    }
}

export class MultiSignatureKeyCountMismatchError extends TransactionError {
    constructor() {
        super(
            `Failed to apply transaction, because the number of provided keys does not match the number of signatures.`,
        );
    }
}

export class IpfsHashAlreadyExists extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because this IPFS hash is already registered for the wallet.`);
    }
}
