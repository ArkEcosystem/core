import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { BusinessAlreadyRegisteredError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessWalletAttributes } from "../interfaces";
import { BusinessRegistrationTransaction } from "../transactions";
import { MarketplaceIndex } from "../wallet-manager";

export class BusinessRegistrationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BusinessRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [
            "business",
            "business.businessAsset",
            "business.transactionId",
            "business.bridgechains",
            "business.resigned",
        ];
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions: Database.IBootstrapTransaction[] = await connection.transactionsRepository.getAssetsByType(
            this.getConstructor().type,
        );
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const asset: IBusinessWalletAttributes = {
                businessAsset: transaction.asset.businessRegistration,
                businessId: this.getBusinessId(walletManager),
            };

            wallet.setAttribute<IBusinessWalletAttributes>("business", asset);
            walletManager.reindex(wallet);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        if (wallet.hasAttribute("business") && wallet.getAttribute("business.resigned") !== true) {
            throw new BusinessAlreadyRegisteredError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BusinessRegistered, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business registration for "${wallet.getAttribute("business")}" already in the pool`,
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
        const businessAsset: IBusinessWalletAttributes = {
            businessAsset: transaction.data.asset.businessRegistration,
            businessId: this.getBusinessId(walletManager),
        };

        sender.setAttribute<IBusinessWalletAttributes>("business", businessAsset);
        walletManager.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.forgetAttribute("business");

        walletManager.forgetByIndex(MarketplaceIndex.Businesses, sender.publicKey);
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

    private getBusinessId(walletManager: State.IWalletManager): Utils.BigNumber {
        return Utils.BigNumber.make(walletManager.getIndex(MarketplaceIndex.Businesses).all().length).plus(1);
    }
}
