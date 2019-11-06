import { State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { InternalTransactionType } from "@arkecosystem/crypto/dist/transactions";

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

export class InvalidTransactionTypeError extends TransactionError {
    constructor(type: string) {
        super(`Transaction type ${type} does not exist.`);
    }
}

export class DeactivatedTransactionHandlerError extends TransactionError {
    constructor(type: InternalTransactionType) {
        super(`Transaction type ${type.toString()} is deactivated.`);
    }
}

export class UnexpectedNonceError extends TransactionError {
    constructor(txNonce: Utils.BigNumber, sender: State.IWallet, reversal: boolean) {
        const action: string = reversal ? "revert" : "apply";
        super(
            `Cannot ${action} a transaction with nonce ${txNonce.toFixed()}: the ` +
                `sender ${sender.publicKey} has nonce ${sender.nonce.toFixed()}.`,
        );
    }
}

export class ColdWalletError extends TransactionError {
    constructor() {
        super(`Insufficient balance in database wallet. Wallet is not allowed to spend before funding is confirmed.`);
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

export class WalletAlreadyResignedError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already resigned as delegate.`);
    }
}

export class WalletNotADelegateError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet is not a delegate.`);
    }
}

export class WalletIsAlreadyDelegateError extends TransactionError {
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
        super(`Failed to apply transaction, because the sender wallet has already voted.`);
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

export class VotedForResignedDelegateError extends TransactionError {
    constructor(vote: string) {
        super(`Failed to apply transaction, because it votes for a resigned delegate.`);
    }
}

export class NotEnoughDelegatesError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because not enough delegates to allow resignation.`);
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

export class LegacyMultiSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because legacy multi signature is no longer supported.`);
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
        super(`Failed to apply transaction, because this IPFS hash is already registered on the blockchain.`);
    }
}

export class HtlcLockTransactionNotFoundError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the associated HTLC lock transaction could not be found.`);
    }
}

export class HtlcSecretHashMismatchError extends TransactionError {
    constructor() {
        super(
            `Failed to apply transaction, because the secret provided does not match the associated HTLC lock transaction secret.`,
        );
    }
}

export class HtlcLockNotExpiredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the associated HTLC lock transaction did not expire yet.`);
    }
}

export class HtlcLockExpiredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the associated HTLC lock transaction expired.`);
    }
}
