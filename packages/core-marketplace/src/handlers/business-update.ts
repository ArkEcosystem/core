import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessIsNotRegisteredError, BusinessIsResignedError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessWalletProperty } from "../interfaces";
import { MarketplaceTransactionTypes } from "../marketplace-transactions";
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
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessWalletAsset = wallet.getAttribute<IBusinessWalletProperty>("business").businessAsset;
            const { name, website, vat, organizationRepository } = transaction.asset.businessUpdate;
            if (name) {
                businessWalletAsset.name = name;
            }
            if (website) {
                businessWalletAsset.website = website;
            }
            if (vat) {
                businessWalletAsset.vat = vat;
            }
            if (organizationRepository) {
                businessWalletAsset.organizationRepository = organizationRepository;
            }
            wallet.setAttribute("business.businessAsset", businessWalletAsset);
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

        if (wallet.getAttribute("business.resigned") === true) {
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

        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletAsset = sender.getAttribute<IBusinessWalletProperty>("business").businessAsset;
        const { name, website, vat, github } = transaction.data.asset.businessUpdate;
        if (name) {
            businessWalletAsset.name = name;
        }
        if (website) {
            businessWalletAsset.website = website;
        }
        if (vat) {
            businessWalletAsset.vat = vat;
        }
        if (github) {
            businessWalletAsset.organizationRepository = github;
        }
        sender.setAttribute("business.businessAsset", businessWalletAsset);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletAsset = sender.getAttribute<IBusinessWalletProperty>("business").businessAsset;

        const transactionsRepository = app.resolvePlugin<Database.IConnection>("database").transactionsRepository;
        const updateTransactions = await transactionsRepository.getAssetsByType(
            MarketplaceTransactionTypes.BusinessUpdate,
        );

        if (Array.isArray(updateTransactions) && updateTransactions.length > 1) {
            const updateTransaction = updateTransactions.pop();
            const { name, website, vat, organizationRepository } = updateTransaction.asset.businessUpdate;
            if (name) {
                businessWalletAsset.name = name;
            }
            if (website) {
                businessWalletAsset.website = website;
            }
            if (vat) {
                businessWalletAsset.vat = vat;
            }
            if (organizationRepository) {
                businessWalletAsset.organizationRepository = organizationRepository;
            }
        } else {
            const registerTransactions = await transactionsRepository.getAssetsByType(
                MarketplaceTransactionTypes.BusinessRegistration,
            );
            const registerTransaction = registerTransactions.pop();

            const { name, website, vat, organizationRepository } = registerTransaction.asset.businessRegistration;
            businessWalletAsset.name = name;
            businessWalletAsset.website = website;
            if (vat) {
                businessWalletAsset.vat = vat;
            }
            if (organizationRepository) {
                businessWalletAsset.organizationRepository = organizationRepository;
            }
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
