import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessIsResignedError, WalletIsNotBusinessError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessWalletProperty } from "../interfaces";
import { BridgechainRegistrationTransaction } from "../transactions";
import { BusinessRegistrationTransactionHandler } from "./business-registration";

export class BridgechainRegistrationTransactionHandler extends Handlers.TransactionHandler {

    private static bridgechainNonce: number = 1000;

    public getConstructor(): Transactions.TransactionConstructor {
        return BridgechainRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        BridgechainRegistrationTransactionHandler.bridgechainNonce = 1000;
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessWalletProperty = wallet.getAttribute<IBusinessWalletProperty>("business");
            if (!businessWalletProperty.bridgechains) {
                businessWalletProperty.bridgechains = [];
            }
            BridgechainRegistrationTransactionHandler.bridgechainNonce = BridgechainRegistrationTransactionHandler.bridgechainNonce + 1;
            businessWalletProperty.bridgechains.push({
                bridgechain: transaction.data.asset.bridgechainRegistration,
                registrationTransactionId: transaction.id,
                bridgechainNonce: BridgechainRegistrationTransactionHandler.bridgechainNonce
            });
            wallet.setAttribute<IBusinessWalletProperty>("business", businessWalletProperty);
            walletManager.reindex(wallet);
        }
    }
    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }
    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }

        if (wallet.getAttribute<IBusinessWalletProperty>("business").isBusinessResigned === true) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BridgechainRegistered, transaction.data);
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
        const businessProperty: IBusinessWalletProperty = sender.getAttribute<IBusinessWalletProperty>("business");
        if (!businessProperty.bridgechains) {
            businessProperty.bridgechains = [];
        }
        BridgechainRegistrationTransactionHandler.bridgechainNonce = BridgechainRegistrationTransactionHandler.bridgechainNonce + 1;
        businessProperty.bridgechains.push({
            bridgechain: transaction.data.asset.bridgechainRegistration,
            registrationTransactionId: transaction.id,
            bridgechainNonce: BridgechainRegistrationTransactionHandler.bridgechainNonce
        });
        sender.setAttribute<IBusinessWalletProperty>("business", businessProperty);
        walletManager.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        BridgechainRegistrationTransactionHandler.bridgechainNonce = BridgechainRegistrationTransactionHandler.bridgechainNonce - 1;
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessProperty: IBusinessWalletProperty = sender.getAttribute<IBusinessWalletProperty>("business");
        businessProperty.bridgechains.filter(bridgechain => {
            return bridgechain.registrationTransactionId !== transaction.data.asset.registrationTransactionId;
        });

        walletManager.reindex(sender);
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
