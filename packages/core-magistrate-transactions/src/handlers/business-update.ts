import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    Enums,
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
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);

                const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = wallet.getAttribute<
                    IBusinessWalletAttributes
                >("business").businessAsset;
                const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.asset
                    .businessUpdate as MagistrateInterfaces.IBusinessUpdateAsset;

                wallet.setAttribute("business.businessAsset", {
                    ...businessWalletAsset,
                    ...businessUpdate,
                });
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new BusinessIsNotRegisteredError();
        }

        if (wallet.getAttribute<IBusinessWalletAttributes>("business").resigned) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MagistrateApplicationEvents.BusinessUpdate, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (
            await pool.senderHasTransactionsOfType(
                data.senderPublicKey,
                Enums.MagistrateTransactionType.BusinessUpdate,
                Enums.MagistrateTransactionGroup,
            )
        ) {
            const wallet: State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business update for "${wallet.getAttribute("business")}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
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
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        let businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;

        const connection: Database.IConnection = app.resolvePlugin<Database.IDatabaseService>("database").connection;
        let reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());
        const updateTransactions: Database.IBootstrapTransaction[] = [];
        while (reader.hasNext()) {
            updateTransactions.push(...(await reader.read()));
        }

        if (updateTransactions.length > 0) {
            const updateTransaction: Database.IBootstrapTransaction = updateTransactions.pop();
            const previousUpdate: MagistrateInterfaces.IBusinessUpdateAsset = updateTransaction.asset.businessUpdate;

            businessWalletAsset = {
                ...businessWalletAsset,
                ...previousUpdate,
            };
        } else {
            reader = await TransactionReader.create(connection, MagistrateTransactions.BusinessRegistrationTransaction);
            const registerTransactions: Database.IBootstrapTransaction[] = [];
            while (reader.hasNext()) {
                registerTransactions.push(...(await reader.read()));
            }

            const registerTransaction: Database.IBootstrapTransaction = registerTransactions.pop();
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
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
