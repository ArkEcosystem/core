import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../enums";
import { BusinessIsNotRegisteredError, BusinessIsResignedError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessRegistrationAsset, IBusinessUpdateAsset, IBusinessWalletAttributes } from "../interfaces";
import { BusinessUpdateTransaction } from "../transactions";
import { BusinessRegistrationTransactionHandler } from "./business-registration";

export class BusinessUpdateTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BusinessUpdateTransaction;
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

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions: Database.IBootstrapTransaction[] = await connection.transactionsRepository.getAssetsByType(
            this.getConstructor().type,
            this.getConstructor().typeGroup,
        );
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);

            const businessWalletAsset: IBusinessRegistrationAsset = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            ).businessAsset;
            const businessUpdate: IBusinessUpdateAsset = transaction.asset.businessUpdate as IBusinessUpdateAsset;

            wallet.setAttribute("business.businessAsset", {
                ...businessWalletAsset,
                ...businessUpdate,
            });
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
        emitter.emit(MarketplaceAplicationEvents.BusinessUpdate, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletAsset: IBusinessRegistrationAsset = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        ).businessAsset;
        const businessUpdate: IBusinessUpdateAsset = transaction.data.asset.businessUpdate;

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
        let businessWalletAsset: IBusinessRegistrationAsset = sender.getAttribute<IBusinessWalletAttributes>("business")
            .businessAsset;

        const transactionsRepository: Database.ITransactionsRepository = app.resolvePlugin<Database.IConnection>(
            "database",
        ).transactionsRepository;
        const updateTransactions: Database.IBootstrapTransaction[] = await transactionsRepository.getAssetsByType(
            MarketplaceTransactionType.BusinessUpdate,
            MarketplaceTransactionGroup,
        );

        if (updateTransactions.length > 0) {
            const updateTransaction: Database.IBootstrapTransaction = updateTransactions.pop();
            const previousUpdate: IBusinessUpdateAsset = updateTransaction.asset.businessUpdate;

            businessWalletAsset = {
                ...businessWalletAsset,
                ...previousUpdate,
            };
        } else {
            const registerTransactions: Database.IBootstrapTransaction[] = await transactionsRepository.getAssetsByType(
                MarketplaceTransactionType.BusinessRegistration,
                MarketplaceTransactionGroup,
            );

            const registerTransaction: Database.IBootstrapTransaction = registerTransactions.pop();
            const previousRegistration: IBusinessRegistrationAsset = registerTransaction.asset.businessRegistration;
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
    ): Promise<void> { }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> { }
}
