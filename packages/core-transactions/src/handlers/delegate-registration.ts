import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    constants,
    DelegateRegistrationTransaction,
    ITransactionData,
    Transaction,
    TransactionConstructor,
} from "@arkecosystem/crypto";
import { WalletUsernameAlreadyRegisteredError, WalletUsernameEmptyError, WalletUsernameNotEmptyError } from "../errors";
import { TransactionHandler } from "./transaction";

const { TransactionTypes } = constants;

export class DelegateRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return DelegateRegistrationTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
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

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        wallet.username = data.asset.delegate.username;
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.username = null;
    }

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.registered", transaction.data);
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        if (
            this.typeFromSenderAlreadyInPool(data, guard) ||
            this.secondSignatureRegistrationFromSenderAlreadyInPool(data, guard)
        ) {
            return false;
        }

        const { username } = data.asset.delegate;
        const delegateRegistrationsSameNameInPayload = guard.transactions.filter(
            tx => tx.type === TransactionTypes.DelegateRegistration && tx.asset.delegate.username === username,
        );

        if (delegateRegistrationsSameNameInPayload.length > 1) {
            guard.pushError(
                data,
                "ERR_CONFLICT",
                `Multiple delegate registrations for "${username}" in transaction payload`,
            );
            return false;
        }

        const delegateRegistrationsInPool: ITransactionData[] = Array.from(
            guard.pool.getTransactionsByType(TransactionTypes.DelegateRegistration),
        ).map((memTx: any) => memTx.transaction.data);

        const containsDelegateRegistrationForSameNameInPool = delegateRegistrationsInPool.some(
            transaction => transaction.asset.delegate.username === username,
        );
        if (containsDelegateRegistrationForSameNameInPool) {
            guard.pushError(data, "ERR_PENDING", `Delegate registration for "${username}" already in the pool`);
            return false;
        }

        return true;
    }
}
