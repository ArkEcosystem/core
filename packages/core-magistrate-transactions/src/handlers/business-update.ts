import { app, Contracts, Container } from "@arkecosystem/core-kernel";
import {
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { BusinessIsNotRegisteredError, BusinessIsResignedError } from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBusinessWalletAttributes } from "../interfaces";
import { BusinessRegistrationTransactionHandler } from "./business-registration";

export class BusinessUpdateTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BusinessUpdateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);

                const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = wallet.getAttribute<
                    IBusinessWalletAttributes
                >("business").businessAsset;
                const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.asset.businessUpdate;

                wallet.setAttribute("business.businessAsset", {
                    ...businessWalletAsset,
                    ...businessUpdate,
                });
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new BusinessIsNotRegisteredError();
        }

        if (wallet.getAttribute<IBusinessWalletAttributes>("business").resigned) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BusinessUpdate, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;
        const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.data.asset.businessUpdate;

        sender.setAttribute("business.businessAsset", {
            ...businessWalletAsset,
            ...businessUpdate,
        });
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        let businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;

        const connection: Contracts.Database.Connection = app.get<Contracts.Database.Connection>(Container.Identifiers.DatabaseService);
        let reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());
        const updateTransactions: Contracts.Database.IBootstrapTransaction[] = [];
        while (reader.hasNext()) {
            updateTransactions.push(...(await reader.read()));
        }

        if (updateTransactions.length > 0) {
            const updateTransaction: Contracts.Database.IBootstrapTransaction = updateTransactions.pop();
            const previousUpdate: MagistrateInterfaces.IBusinessUpdateAsset = updateTransaction.asset.businessUpdate;

            businessWalletAsset = {
                ...businessWalletAsset,
                ...previousUpdate,
            };
        } else {
            reader = await TransactionReader.create(connection, MagistrateTransactions.BusinessRegistrationTransaction);
            const registerTransactions: Contracts.Database.IBootstrapTransaction[] = [];
            while (reader.hasNext()) {
                registerTransactions.push(...(await reader.read()));
            }

            const registerTransaction: Contracts.Database.IBootstrapTransaction = registerTransactions.pop();
            const previousRegistration: MagistrateInterfaces.IBusinessRegistrationAsset =
                registerTransaction.asset.businessRegistration;
            businessWalletAsset = {
                ...businessWalletAsset,
                ...previousRegistration,
            };
        }

        sender.setAttribute("business.businessAsset", businessWalletAsset);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
