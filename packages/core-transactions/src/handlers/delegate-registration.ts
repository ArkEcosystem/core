import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Transactions } from "@arkecosystem/crypto";
import { WalletUsernameAlreadyRegisteredError, WalletUsernameEmptyError, WalletUsernameNotEmptyError } from "../errors";
import { TransactionHandler } from "./transaction";

const { TransactionTypes } = Enums;

export class DelegateRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateRegistrationTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        const { data } = transaction;
        const { username } = data.asset.delegate;
        if (!username) {
            throw new WalletUsernameEmptyError();
        }

        if (wallet.username) {
            throw new WalletUsernameNotEmptyError();
        }

        if (walletManager) {
            if (walletManager.findByUsername(username)) {
                throw new WalletUsernameAlreadyRegisteredError(username);
            }
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        wallet.username = data.asset.delegate.username;
    }

    public revert(transaction: Interfaces.ITransaction, wallet: Database.IWallet): void {
        wallet.username = null;
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.registered", transaction.data);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (
            this.typeFromSenderAlreadyInPool(data, pool, processor) ||
            this.secondSignatureRegistrationFromSenderAlreadyInPool(data, pool, processor)
        ) {
            return false;
        }

        const { username } = data.asset.delegate;
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
        ).map((memTx: any) => memTx.transaction.data);

        const containsDelegateRegistrationForSameNameInPool = delegateRegistrationsInPool.some(
            transaction => transaction.asset.delegate.username === username,
        );
        if (containsDelegateRegistrationForSameNameInPool) {
            processor.pushError(data, "ERR_PENDING", `Delegate registration for "${username}" already in the pool`);
            return false;
        }

        return true;
    }
}
