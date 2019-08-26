import { app, Contracts } from "@arkecosystem/core-kernel";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Enums, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import assert = require("assert");
import {
    HtlcLockNotExpiredError,
    HtlcLockTransactionNotFoundError,
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

export class HtlcRefundTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcRefundTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [HtlcLockTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(
        connection: Contracts.Database.IConnection,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const lockId = transaction.asset.refund.lockTransactionId;
            const lockWallet: Contracts.State.IWallet = walletManager.findByIndex(
                Contracts.State.WalletIndexes.Locks,
                lockId,
            );
            const locks = lockWallet.getAttribute("htlc.locks");
            lockWallet.balance = lockWallet.balance.plus(locks[lockId].amount);
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
        sender: Contracts.State.IWallet,
        databaseWalletManager: Contracts.State.IWalletManager,
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
            const dbSender: Contracts.State.IWallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
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
            const dbSender: Contracts.State.IWallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
            if (!dbSender.hasMultiSignature()) {
                throw new UnexpectedMultiSignatureError();
            }

            if (!sender.verifySignatures(data, sender.getAttribute("multiSignature"))) {
                throw new InvalidMultiSignatureError();
            }
        } else if (transaction.type !== Enums.TransactionType.MultiSignature && transaction.data.signatures) {
            throw new UnexpectedMultiSignatureError();
        }

        // Specific HTLC refund checks
        const refundAsset = transaction.data.asset.refund;
        const lockId = refundAsset.lockTransactionId;
        const lockWallet = databaseWalletManager.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new HtlcLockTransactionNotFoundError();
        }

        const lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock: Interfaces.IBlock = app.ioc
            .get<Contracts.State.IStateService>("state")
            .getStore()
            .getLastBlock();
        const lastBlockEpochTimestamp = lastBlock.data.timestamp;
        const expiration = lockTransaction.asset.lock.expiration;
        if (
            (expiration.type === UnixTimestamp && expiration.value > formatTimestamp(lastBlockEpochTimestamp).unix) ||
            (expiration.type === BlockHeight && expiration.value > lastBlock.data.height)
        ) {
            throw new HtlcLockNotExpiredError();
        }
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.IConnection,
        processor: Contracts.TransactionPool.IProcessor,
    ): Promise<boolean> {
        const lockId: string = data.asset.refund.lockTransactionId;
        const lockWallet: Contracts.State.IWallet = pool.walletManager.findByIndex(
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
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
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

        const lockId: string = data.asset.refund.lockTransactionId;
        const lockWallet: Contracts.State.IWallet = walletManager.findByIndex(
            Contracts.State.WalletIndexes.Locks,
            lockId,
        );
        assert(lockWallet && lockWallet.getAttribute("htlc.locks", {})[lockId]);

        const locks = lockWallet.getAttribute("htlc.locks");
        const newBalance = lockWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert(!newBalance.isNegative());

        lockWallet.balance = newBalance;
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.minus(locks[lockId].amount));
        delete locks[lockId];
        lockWallet.setAttribute("htlc.locks", locks);

        walletManager.reindex(lockWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const sender: Contracts.State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const data: Interfaces.ITransactionData = transaction.data;

        if (data.version > 1) {
            if (!sender.nonce.isEqualTo(data.nonce)) {
                throw new UnexpectedNonceError(data.nonce, sender.nonce, true);
            }

            sender.nonce = sender.nonce.minus(1);
        }

        // todo to improve : not so good to call database from here, would need a better way
        const databaseService = app.ioc.get<Contracts.Database.IDatabaseService>("database");

        const lockId = transaction.data.asset.refund.lockTransactionId;
        const lockTransaction = await databaseService.transactionsBusinessRepository.findById(lockId);
        const lockWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);

        lockWallet.balance = lockWallet.balance.minus(lockTransaction.amount).plus(transaction.data.fee);
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));
        const locks = lockWallet.getAttribute("htlc.locks", {});
        locks[lockTransaction.id] = lockTransaction;
        lockWallet.setAttribute("htlc.locks", locks);

        walletManager.reindex(lockWallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}
}
