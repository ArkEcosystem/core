import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BridgechainRegistrationAssetError, BusinessIsResignedError, WalletIsNotBusinessError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBridgechainRegistrationAsset, IBusinessWalletProperty } from "../interfaces";
import { BridgechainRegistrationTransaction } from "../transactions";
import { BusinessRegistrationTransactionHandler } from "./business-registration";

export class BridgechainRegistrationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BridgechainRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessWalletProperty = wallet.getAttribute<IBusinessWalletProperty>("business");
            if (!businessWalletProperty.bridgechains) {
                businessWalletProperty.bridgechains = [];
            }
            businessWalletProperty.bridgechains.push({
                bridgechain: transaction.data.asset.bridgechainRegistration,
                registrationTransactionId: transaction.id,
            });
            wallet.setAttribute<IBusinessWalletProperty>("business", businessWalletProperty);
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
        const bridgechainAsset: IBridgechainRegistrationAsset = transaction.data.asset.bridgechainRegistration;

        if (
            !bridgechainAsset.name ||
            !bridgechainAsset.seedNodes ||
            !bridgechainAsset.genesisHash ||
            !bridgechainAsset.githubRepository
        ) {
            throw new BridgechainRegistrationAssetError();
        }

        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }

        if (wallet.getAttribute<IBusinessWalletProperty>("business").isBusinessResigned === true) {
            throw new BusinessIsResignedError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BridgechainRegistered, transaction.data);
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
        const businessProperty: IBusinessWalletProperty = sender.getAttribute<IBusinessWalletProperty>("business");
        if (!businessProperty.bridgechains) {
            businessProperty.bridgechains = [];
        }
        businessProperty.bridgechains.push({
            bridgechain: transaction.data.asset.bridgechainRegistration,
            registrationTransactionId: transaction.id,
        });
        sender.setAttribute<IBusinessWalletProperty>("business", businessProperty);
        walletManager.reindex(sender);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessProperty: IBusinessWalletProperty = sender.getAttribute<IBusinessWalletProperty>("business");
        businessProperty.bridgechains.filter(bridgechain => {
            return bridgechain.registrationTransactionId !== transaction.data.asset.registrationTransactionId;
        });
        walletManager.reindex(sender);
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
