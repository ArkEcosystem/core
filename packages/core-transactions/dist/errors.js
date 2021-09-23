"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
class TransactionError extends Error {
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
exports.TransactionError = TransactionError;
class NotImplementedError extends TransactionError {
    constructor() {
        super(`Feature is not available.`);
    }
}
exports.NotImplementedError = NotImplementedError;
class InvalidTransactionTypeError extends TransactionError {
    constructor(type) {
        super(`Transaction type ${type} does not exist.`);
    }
}
exports.InvalidTransactionTypeError = InvalidTransactionTypeError;
class DeactivatedTransactionHandlerError extends TransactionError {
    constructor(type) {
        super(`Transaction type ${type.toString()} is deactivated.`);
    }
}
exports.DeactivatedTransactionHandlerError = DeactivatedTransactionHandlerError;
class UnexpectedNonceError extends TransactionError {
    constructor(txNonce, sender, reversal) {
        const action = reversal ? "revert" : "apply";
        super(`Cannot ${action} a transaction with nonce ${txNonce.toFixed()}: the ` +
            `sender ${sender.publicKey} has nonce ${sender.nonce.toFixed()}.`);
    }
}
exports.UnexpectedNonceError = UnexpectedNonceError;
class ColdWalletError extends TransactionError {
    constructor() {
        super(`Insufficient balance in database wallet. Wallet is not allowed to spend before funding is confirmed.`);
    }
}
exports.ColdWalletError = ColdWalletError;
class InsufficientBalanceError extends TransactionError {
    constructor() {
        super(`Insufficient balance in the wallet.`);
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
class SenderWalletMismatchError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the public key does not match the wallet.`);
    }
}
exports.SenderWalletMismatchError = SenderWalletMismatchError;
class UnexpectedSecondSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because wallet does not allow second signatures.`);
    }
}
exports.UnexpectedSecondSignatureError = UnexpectedSecondSignatureError;
class UnexpectedMultiSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because multi signatures are currently not supported.`);
    }
}
exports.UnexpectedMultiSignatureError = UnexpectedMultiSignatureError;
class InvalidSecondSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the second signature could not be verified.`);
    }
}
exports.InvalidSecondSignatureError = InvalidSecondSignatureError;
class WalletAlreadyResignedError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already resigned as delegate.`);
    }
}
exports.WalletAlreadyResignedError = WalletAlreadyResignedError;
class WalletNotADelegateError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet is not a delegate.`);
    }
}
exports.WalletNotADelegateError = WalletNotADelegateError;
class WalletIsAlreadyDelegateError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet already has a registered username.`);
    }
}
exports.WalletIsAlreadyDelegateError = WalletIsAlreadyDelegateError;
class WalletNoUsernameError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet has no registered username.`);
    }
}
exports.WalletNoUsernameError = WalletNoUsernameError;
class WalletUsernameAlreadyRegisteredError extends TransactionError {
    constructor(username) {
        super(`Failed to apply transaction, because the username '${username}' is already registered.`);
    }
}
exports.WalletUsernameAlreadyRegisteredError = WalletUsernameAlreadyRegisteredError;
class SecondSignatureAlreadyRegisteredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because second signature is already enabled.`);
    }
}
exports.SecondSignatureAlreadyRegisteredError = SecondSignatureAlreadyRegisteredError;
class NotSupportedForMultiSignatureWalletError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because multi signature is enabled.`);
    }
}
exports.NotSupportedForMultiSignatureWalletError = NotSupportedForMultiSignatureWalletError;
class AlreadyVotedError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the sender wallet has already voted.`);
    }
}
exports.AlreadyVotedError = AlreadyVotedError;
class NoVoteError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet has not voted.`);
    }
}
exports.NoVoteError = NoVoteError;
class UnvoteMismatchError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the wallet vote does not match.`);
    }
}
exports.UnvoteMismatchError = UnvoteMismatchError;
class VotedForNonDelegateError extends TransactionError {
    constructor(vote) {
        super(`Failed to apply transaction, because only delegates can be voted.`);
    }
}
exports.VotedForNonDelegateError = VotedForNonDelegateError;
class VotedForResignedDelegateError extends TransactionError {
    constructor(vote) {
        super(`Failed to apply transaction, because it votes for a resigned delegate.`);
    }
}
exports.VotedForResignedDelegateError = VotedForResignedDelegateError;
class NotEnoughDelegatesError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because not enough delegates to allow resignation.`);
    }
}
exports.NotEnoughDelegatesError = NotEnoughDelegatesError;
class MultiSignatureAlreadyRegisteredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because multi signature is already enabled.`);
    }
}
exports.MultiSignatureAlreadyRegisteredError = MultiSignatureAlreadyRegisteredError;
class InvalidMultiSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the multi signature could not be verified.`);
    }
}
exports.InvalidMultiSignatureError = InvalidMultiSignatureError;
class LegacyMultiSignatureError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because legacy multi signature is no longer supported.`);
    }
}
exports.LegacyMultiSignatureError = LegacyMultiSignatureError;
class MultiSignatureMinimumKeysError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because too few keys were provided.`);
    }
}
exports.MultiSignatureMinimumKeysError = MultiSignatureMinimumKeysError;
class MultiSignatureKeyCountMismatchError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the number of provided keys does not match the number of signatures.`);
    }
}
exports.MultiSignatureKeyCountMismatchError = MultiSignatureKeyCountMismatchError;
class IpfsHashAlreadyExists extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because this IPFS hash is already registered on the blockchain.`);
    }
}
exports.IpfsHashAlreadyExists = IpfsHashAlreadyExists;
class HtlcLockTransactionNotFoundError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the associated HTLC lock transaction could not be found.`);
    }
}
exports.HtlcLockTransactionNotFoundError = HtlcLockTransactionNotFoundError;
class HtlcSecretHashMismatchError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the secret provided does not match the associated HTLC lock transaction secret.`);
    }
}
exports.HtlcSecretHashMismatchError = HtlcSecretHashMismatchError;
class HtlcLockNotExpiredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the associated HTLC lock transaction did not expire yet.`);
    }
}
exports.HtlcLockNotExpiredError = HtlcLockNotExpiredError;
class HtlcLockExpiredError extends TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the associated HTLC lock transaction expired.`);
    }
}
exports.HtlcLockExpiredError = HtlcLockExpiredError;
//# sourceMappingURL=errors.js.map