import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import {
    BridgechainIsNotRegisteredError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBridgechainUpdateAsset, IBusinessWalletProperty } from "../interfaces";
import { MarketplaceTransactionTypes } from "../marketplace-transactions";
import { BridgechainUpdateTransaction } from "../transactions";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";

export class BridgechainUpdateTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BridgechainUpdateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
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
            const bridgechains = wallet.getAttribute<IBusinessWalletProperty>("business").bridgechains;
            const { registeredBridgechainId, seedNodes } = transaction.asset
                .bridgechainUpdateAsset as IBridgechainUpdateAsset;
            const bridgechainWalletProperty = bridgechains.find(
                bridgechain => bridgechain.registrationTransactionId === registeredBridgechainId,
            );
            bridgechainWalletProperty.bridgechain.seedNodes = seedNodes;
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
        const bridgechains = wallet.getAttribute<IBusinessWalletProperty>("business").bridgechains;
        const bridgechainWalletProperty = bridgechains.find(
            bridgechain =>
                bridgechain.registrationTransactionId ===
                transaction.data.asset.bridgechainUpdate.registeredBridgechainId,
        );

        if (!bridgechainWalletProperty) {
            throw new BridgechainIsNotRegisteredError();
        }

        if (bridgechainWalletProperty.resigned) {
            throw new BridgechainIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BridgechainUpdate, transaction.data);
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
        const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const bridgechains = wallet.getAttribute<IBusinessWalletProperty>("business").bridgechains;
        const { registeredBridgechainId, seedNodes } = transaction.data.asset
            .bridgechainUpdate as IBridgechainUpdateAsset;
        const bridgechainWalletProperty = bridgechains.find(
            bridgechain => bridgechain.registrationTransactionId === registeredBridgechainId,
        );
        bridgechainWalletProperty.bridgechain.seedNodes = seedNodes;
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const walletBridgechains = sender.getAttribute<IBusinessWalletProperty>("business").bridgechains;

        const transactionsRepository = app.resolvePlugin<Database.IConnection>("database").transactionsRepository;
        const updateTransactions = await transactionsRepository.getAssetsByType(
            MarketplaceTransactionTypes.BridgechainUpdate,
        );
        if (Array.isArray(updateTransactions) && updateTransactions.length > 1) {
            const updateTransaction = updateTransactions.pop();
            const { seedNodes, registeredBridgechainId } = updateTransaction.asset
                .bridgechainUpdate as IBridgechainUpdateAsset;
            const bridgechainWalletProperty = walletBridgechains.find(
                bridgechain => bridgechain.registrationTransactionId === registeredBridgechainId,
            );
            bridgechainWalletProperty.bridgechain.seedNodes = seedNodes;
        } else {
            const transactionId = transaction.data.asset.bridgechainUpdate.registrationTransactionId;
            const registerTransaction = await transactionsRepository.findById(transactionId);

            const bridgechainFromWallet = walletBridgechains.find(
                bridgechain => bridgechain.registrationTransactionId === transactionId,
            );

            bridgechainFromWallet.bridgechain.seedNodes = registerTransaction.asset.bridgechainUpdate.seedNodes;
        }
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
