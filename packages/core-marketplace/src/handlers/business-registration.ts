import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessAlreadyRegisteredError, BusinessRegistrationAssetError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessRegistrationAsset, IBusinessWalletProperty } from "../interfaces";
import { BusinessRegistrationTransaction } from "../transactions";

export class BusinessRegistrationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BusinessRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<any> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessProperty: IBusinessWalletProperty = {
                businessAsset: transaction.asset.businessRegistration,
                isBusinessResigned: false,
            };
            wallet.setAttribute<IBusinessWalletProperty>("business", businessProperty);
            walletManager.reindex(wallet);
        }
    }
    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }
    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        const businessAsset: IBusinessRegistrationAsset = transaction.data.asset.businessRegistration;
        if (!businessAsset.name || !businessAsset.website) {
            throw new BusinessRegistrationAssetError();
        }

        if (wallet.hasAttribute("business")) {
            throw new BusinessAlreadyRegisteredError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BusinessRegistered, transaction.data);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        return !this.typeFromSenderAlreadyInPool(data, pool, processor);
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessProperty: IBusinessWalletProperty = {
            businessAsset: transaction.data.asset.businessRegistration,
            isBusinessResigned: false,
        };
        sender.setAttribute<IBusinessWalletProperty>("business", businessProperty);
        walletManager.reindex(sender);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.forgetAttribute("business");
        walletManager.reindex(sender);
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
