import { app, Contracts, Container } from "@arkecosystem/core-kernel";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Crypto, Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert = require("assert");
import {
    HtlcLockExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcSecretHashMismatchError,
    InvalidMultiSignatureError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedMultiSignatureError,
    UnexpectedNonceError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { HtlcLockTransactionHandler } from "./htlc-lock";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

const { UnixTimestamp, BlockHeight } = Transactions.enums.HtlcLockExpirationType;

export class HtlcClaimTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcClaimTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [HtlcLockTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const lockId = transaction.asset.claim.lockTransactionId;
            const lockWallet: Contracts.State.Wallet = walletManager.findByIndex(
                Contracts.State.WalletIndexes.Locks,
                lockId,
            );
            const locks = lockWallet.getAttribute("htlc.locks");
            const claimWallet: Contracts.State.Wallet = walletManager.findByAddress(locks[lockId].recipientId);
            claimWallet.balance = claimWallet.balance.plus(locks[lockId].amount);
            const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
            lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.minus(locks[lockId].amount));
            delete locks[lockId];
            lockWallet.setAttribute("htlc.locks", locks);
            walletManager.reindex(lockWallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public dynamicFee(
        transaction: Interfaces.ITransaction,
        addonBytes: number,
        satoshiPerByte: number,
    ): Utils.BigNumber {
        // override dynamicFee calculation as this is a zero-fee transaction
        return Utils.BigNumber.ZERO;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
        databaseWalletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        // Common checks (copied from inherited transaction handler class)
        // Only common balance check was removed because we need a specific balance check here
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            return;
        }

        if (data.version > 1 && data.nonce.isLessThanOrEqualTo(sender.nonce)) {
            throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
        }

        if (data.senderPublicKey !== sender.publicKey) {
            throw new SenderWalletMismatchError();
        }

        if (sender.hasSecondSignature()) {
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender: Contracts.State.Wallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
            if (!dbSender.hasSecondSignature()) {
                throw new UnexpectedSecondSignatureError();
            }

            if (!Transactions.Verifier.verifySecondSignature(data, sender.getAttribute("secondPublicKey"))) {
                throw new InvalidSecondSignatureError();
            }
        } else if (data.secondSignature || data.signSignature) {
            const isException =
                Managers.configManager.get("network.name") === "devnet" &&
                Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            if (!isException) {
                throw new UnexpectedSecondSignatureError();
            }
        }

        if (sender.hasMultiSignature()) {
            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const dbSender: Contracts.State.Wallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
            if (!dbSender.hasMultiSignature()) {
                throw new UnexpectedMultiSignatureError();
            }

            if (!sender.verifySignatures(data, sender.getAttribute("multiSignature"))) {
                throw new InvalidMultiSignatureError();
            }
        } else if (transaction.type !== Enums.TransactionType.MultiSignature && transaction.data.signatures) {
            throw new UnexpectedMultiSignatureError();
        }

        // Specific HTLC claim checks
        const claimAsset = transaction.data.asset.claim;
        const lockId = claimAsset.lockTransactionId;
        const lockWallet = databaseWalletManager.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock: Interfaces.IBlock = app
            .get<Contracts.State.StateService>(Container.Identifiers.StateService)
            .getStore()
            .getLastBlock();
        const lastBlockEpochTimestamp = lastBlock.data.timestamp;
        const expiration = lockTransaction.asset.lock.expiration;
        if (
            (expiration.type === UnixTimestamp && expiration.value <= formatTimestamp(lastBlockEpochTimestamp).unix) ||
            (expiration.type === BlockHeight && expiration.value <= lastBlock.data.height)
        ) {
            throw new HtlcLockExpiredError();
        }

        const unlockSecretHash = Crypto.HashAlgorithms.sha256(claimAsset.unlockSecret).toString("hex");
        if (lockTransaction.asset.lock.secretHash !== unlockSecretHash) {
            throw new HtlcSecretHashMismatchError();
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        const lockId = data.asset.claim.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = pool.walletManager.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            processor.pushError(
                data,
                "ERR_HTLCLOCKNOTFOUND",
                `The associated lock transaction id "${lockId}" was not found.`,
            );
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (Utils.isException(data)) {
            walletManager.logger.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }

        await this.throwIfCannotBeApplied(transaction, sender, walletManager);

        if (data.version > 1) {
            if (!sender.nonce.plus(1).isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, false);
            }

            sender.nonce = data.nonce;
        }

        const lockId = data.asset.claim.lockTransactionId;
        const lockWallet: Contracts.State.Wallet = walletManager.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        assert(lockWallet && lockWallet.getAttribute("htlc.locks", {})[lockId]);

        const locks = lockWallet.getAttribute("htlc.locks");
        const recipientWallet = walletManager.findByAddress(locks[lockId].recipientId);

        const newBalance = recipientWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());

        recipientWallet.balance = newBalance;
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.minus(locks[lockId].amount));
        delete locks[lockId];
        lockWallet.setAttribute("htlc.locks", locks);

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        const sender: Contracts.State.Wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (data.version > 1) {
            if (!sender.nonce.isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, true);
            }

            sender.nonce = sender.nonce.minus(1);
        }

        // todo to improve : not so good to call database from here, would need a better way
        const databaseService = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);

        const lockId = data.asset.claim.lockTransactionId;
        const lockTransaction = await databaseService.transactionsBusinessRepository.findById(lockId);
        const lockWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);
        const recipientWallet = walletManager.findByAddress(lockTransaction.recipientId);

        recipientWallet.balance = recipientWallet.balance.minus(lockTransaction.amount).plus(data.fee);
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));
        const locks = lockWallet.getAttribute("htlc.locks", {});
        locks[lockTransaction.id] = lockTransaction;
        lockWallet.setAttribute("htlc.locks", locks);

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
        walletManager.reindex(recipientWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}
