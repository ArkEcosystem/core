import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { constants, ITransactionData, models, Transaction } from "@arkecosystem/crypto";
import { WalletUsernameAlreadyRegisteredError, WalletUsernameEmptyError, WalletUsernameNotEmptyError } from "../errors";
import { TransactionService } from "./transaction";

const { TransactionTypes } = constants;

export class DelegateRegistrationTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.DelegateRegistration;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: models.Wallet,
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

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        const { data } = transaction;
        wallet.username = data.asset.delegate.username;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        wallet.username = null;
    }

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit("delegate.registered", transaction.data);
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.ITransactionGuard): boolean {
        if (this.typeFromSenderAlreadyInPool(data, guard)) {
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
