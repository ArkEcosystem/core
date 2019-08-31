import { Contracts, Enums } from "@arkecosystem/core-kernel";
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
        connection: Contracts.Database.Connection,
        walletManager: Contracts.State.WalletManager,
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
        wallet: Contracts.State.Wallet,
        databaseWalletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        if (!wallet.isDelegate()) {
            throw new WalletNotADelegateError();
        }

        if (wallet.hasAttribute("delegate.resigned")) {
            throw new WalletAlreadyResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(Enums.Events.State.DelegateResigned, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: Contracts.State.Wallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
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
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        walletManager.findByPublicKey(transaction.data.senderPublicKey).setAttribute("delegate.resigned", true);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        walletManager.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("delegate.resigned");
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: Contracts.State.WalletManager,
    ): Promise<void> {}
}
