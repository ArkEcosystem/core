import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import {
    BridgechainIsNotRegisteredError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    WalletIsNotBusinessError,
} from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessWalletProperty } from "../interfaces";
import { BridgechainResignationTransaction } from "../transactions";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";

export class BridgechainResignationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BridgechainResignationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessWalletProperty = wallet.getAttribute<IBusinessWalletProperty>("business");
            businessWalletProperty.bridgechains.map(bridgechain => {
                if (
                    bridgechain.registrationTransactionId ===
                    transaction.data.asset.bridgechainResignation.registeredBridgechainId
                ) {
                    bridgechain.isBridgechainResigned = true;
                }
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
        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }
        const businessWalletProperty = wallet.getAttribute<IBusinessWalletProperty>("business");
        if (businessWalletProperty.isBusinessResigned) {
            throw new BusinessIsNotRegisteredError();
        }

        const hasBridgechain = businessWalletProperty.bridgechains.find(
            bridgechain =>
                bridgechain.registrationTransactionId ===
                transaction.data.asset.bridgechainResignation.registeredBridgechainId,
        );

        if (!hasBridgechain) {
            throw new BridgechainIsNotRegisteredError();
        }

        if (hasBridgechain.isBridgechainResigned) {
            throw new BridgechainIsResignedError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BridgechainResigned, transaction.data);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business resignation for "${wallet.getAttribute("bridgechain")}" already in the pool`,
            );
            return false;
        }
        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletProperty = sender.getAttribute<IBusinessWalletProperty>("business");
        businessWalletProperty.bridgechains.map(bridgechain => {
            if (
                bridgechain.registrationTransactionId ===
                transaction.data.asset.bridgechainResignation.registeredBridgechainId
            ) {
                bridgechain.isBridgechainResigned = true;
            }
        });
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletProperty = sender.getAttribute<IBusinessWalletProperty>("business");
        businessWalletProperty.bridgechains.map(bridgechain => {
            if (
                bridgechain.registrationTransactionId ===
                transaction.data.asset.bridgechainResignation.registeredBridgechainId
            ) {
                bridgechain.isBridgechainResigned = false;
            }
        });
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
