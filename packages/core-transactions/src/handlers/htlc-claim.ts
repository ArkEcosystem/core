import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Crypto, Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import assert = require("assert");
import {
    HtlcLockExpiredError,
    HtlcLockTransactionNotFoundError,
    HtlcNotLockRecipientError,
    HtlcSecretHashMismatchError,
} from "../errors";
import { TransactionHandler } from "./transaction";

export class HtlcClaimTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcClaimTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const lockId = transaction.asset.claim.lockTransactionId;
            const lockWallet: State.IWallet = walletManager.findByLockId(lockId);
            const claimWallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            claimWallet.balance = claimWallet.balance.plus(lockWallet.locks[lockId].amount).minus(transaction.fee);
            lockWallet.lockedBalance = lockWallet.lockedBalance.minus(lockWallet.locks[lockId].amount);
            delete lockWallet.locks[lockId];
        }
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);

        const claimAsset = transaction.data.asset.claim;
        const lockId = claimAsset.lockTransactionId;
        const lockWallet = databaseWalletManager.findByLockId(lockId);
        if (!lockWallet) {
            throw new HtlcLockTransactionNotFoundError();
        }

        if (
            lockWallet.locks[lockId].recipientId !== Identities.Address.fromPublicKey(transaction.data.senderPublicKey)
        ) {
            throw new HtlcNotLockRecipientError();
        }

        const lastBlock: Interfaces.IBlock = app
            .resolvePlugin<State.IStateService>("state")
            .getStore()
            .getLastBlock();
        if (lockWallet.locks[lockId].asset.lock.expiration <= lastBlock.data.timestamp) {
            throw new HtlcLockExpiredError();
        }

        const unlockSecretHash = Crypto.HashAlgorithms.hash256(claimAsset.unlockSecret).toString("hex");
        if (lockWallet.locks[lockId].asset.lock.secretHash !== unlockSecretHash) {
            throw new HtlcSecretHashMismatchError();
        }
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const lockId = transaction.data.asset.claim.lockTransactionId;
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const lockWallet: State.IWallet = walletManager.findByLockId(lockId);
        assert(lockWallet && lockWallet.locks[lockId]);

        const newBalance = sender.balance.plus(lockWallet.locks[lockId].amount).minus(transaction.data.fee);
        assert(!newBalance.isNegative());

        sender.balance = newBalance;
        lockWallet.lockedBalance = lockWallet.lockedBalance.minus(lockWallet.locks[lockId].amount);
        delete lockWallet.locks[lockId];

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        super.revertForSender(transaction, walletManager);

        // todo to improve : not so good to call database from here, would need a better way
        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

        const lockId = transaction.data.asset.claim.lockTransactionId;
        const lockTransaction = await databaseService.transactionsBusinessRepository.findById(lockId);
        const lockWallet = walletManager.findByPublicKey(lockTransaction.senderPublicKey);
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        sender.balance = sender.balance.minus(lockTransaction.amount).plus(transaction.data.fee);
        lockWallet.lockedBalance = lockWallet.lockedBalance.plus(lockTransaction.amount);
        lockWallet.locks[lockTransaction.id] = lockTransaction;

        walletManager.reindex(sender);
        walletManager.reindex(lockWallet);
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
