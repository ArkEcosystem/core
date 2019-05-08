import { EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Transactions } from "@arkecosystem/crypto";
import {
    NotSupportedForMultiSignatureWalletError,
    WalletUsernameAlreadyRegisteredError,
    WalletUsernameEmptyError,
    WalletUsernameNotEmptyError,
} from "../errors";
import { TransactionHandler } from "./transaction";

const { TransactionTypes } = Enums;

export class DelegateRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateRegistrationTransaction;
    }

    public bootstrap(transactions: Interfaces.ITransactionData[], walletManager: State.IWalletManager): void {
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.username = transaction.asset.delegate.username;
            walletManager.reindex(wallet);
        }

        // Forged Blocks...
        // const forgedBlocks = await this.query.manyOrNone(queries.integrityVerifier.delegatesForgedBlocks);
        // for (const block of forgedBlocks) {
        //     const wallet = walletManager.findByPublicKey(block.generatorPublicKey);
        //     wallet.forgedFees = wallet.forgedFees.plus(block.totalFees);
        //     wallet.forgedRewards = wallet.forgedRewards.plus(block.totalRewards);
        //     wallet.producedBlocks = +block.totalProduced;
        // }

        walletManager.buildDelegateRanking(walletManager.allByUsername());
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): boolean {
        const { data }: Interfaces.ITransaction = transaction;

        if (databaseWalletManager.findByPublicKey(data.senderPublicKey).multisignature) {
            throw new NotSupportedForMultiSignatureWalletError();
        }

        const { username }: { username: string } = data.asset.delegate;
        if (!username) {
            throw new WalletUsernameEmptyError();
        }

        if (wallet.username) {
            throw new WalletUsernameNotEmptyError();
        }

        if (databaseWalletManager.findByUsername(username)) {
            throw new WalletUsernameAlreadyRegisteredError(username);
        }

        return super.canBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.registered", transaction.data);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        const { username }: { username: string } = data.asset.delegate;
        const delegateRegistrationsSameNameInPayload = processor
            .getTransactions()
            .filter(tx => tx.type === TransactionTypes.DelegateRegistration && tx.asset.delegate.username === username);

        if (delegateRegistrationsSameNameInPayload.length > 1) {
            processor.pushError(
                data,
                "ERR_CONFLICT",
                `Multiple delegate registrations for "${username}" in transaction payload`,
            );
            return false;
        }

        const delegateRegistrationsInPool: Interfaces.ITransactionData[] = Array.from(
            pool.getTransactionsByType(TransactionTypes.DelegateRegistration),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const containsDelegateRegistrationForSameNameInPool: boolean = delegateRegistrationsInPool.some(
            transaction => transaction.asset.delegate.username === username,
        );
        if (containsDelegateRegistrationForSameNameInPool) {
            processor.pushError(data, "ERR_PENDING", `Delegate registration for "${username}" already in the pool`);
            return false;
        }

        return true;
    }

    protected applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.username = transaction.data.asset.delegate.username;

        walletManager.reindex(sender);
    }

    protected revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

        walletManager.forgetByUsername(sender.username);
        sender.username = undefined;
    }

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        return;
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        return;
    }
}
