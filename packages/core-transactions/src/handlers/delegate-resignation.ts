import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { app, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { WalletAlreadyResignedError, WalletNotADelegateError } from "../errors";
import { DelegateRegistrationTransactionHandler } from "./delegate-registration";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class DelegateResignationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateResignationTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [DelegateRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["delegate.resigned"];
    }

    public async bootstrap(
        connection: Contracts.Database.IConnection,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            walletManager.findByPublicKey(transaction.senderPublicKey).setAttribute("delegate.resigned", true);
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.IWallet,
        databaseWalletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        if (!wallet.isDelegate()) {
            throw new WalletNotADelegateError();
        }

        if (wallet.hasAttribute("delegate.resigned")) {
            throw new WalletAlreadyResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.IEventDispatcher): void {
        emitter.dispatch(ApplicationEvents.DelegateResigned, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: Contracts.State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Delegate resignation for "${wallet.getAttribute("delegate.username")}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        walletManager.findByPublicKey(transaction.data.senderPublicKey).setAttribute("delegate.resigned", true);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        walletManager.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("delegate.resigned");
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
