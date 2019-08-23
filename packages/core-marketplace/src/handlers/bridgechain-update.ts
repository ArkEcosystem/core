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
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBridgechainWalletAttributes,
    IBusinessWalletAttributes,
} from "../interfaces";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../marketplace-transactions";
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
        const transactions: Database.IBootstrapTransaction[] = await connection.transactionsRepository.getAssetsByType(
            this.getConstructor().type,
            this.getConstructor().typeGroup,
        );
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );

            const { bridgechainId, seedNodes } = transaction.asset.bridgechainUpdate;
            businessAttributes.bridgechains[bridgechainId].bridgechainAsset.seedNodes = seedNodes;

            walletManager.reindex(wallet);
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

        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        const bridgechainUpdate: IBridgechainUpdateAsset = transaction.data.asset.bridgechainUpdate;
        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId.toFixed()];

        if (!bridgechainAttributes) {
            throw new BridgechainIsNotRegisteredError();
        }

        if (bridgechainAttributes.resigned) {
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

        const wallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        const bridgechainUpdate: IBridgechainUpdateAsset = transaction.data.asset.bridgechainUpdate;

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId.toFixed()];
        bridgechainAttributes.bridgechainAsset.seedNodes = bridgechainUpdate.seedNodes;

        walletManager.reindex(wallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        const transactionsRepository: Database.ITransactionsRepository = app.resolvePlugin<Database.IConnection>(
            "database",
        ).transactionsRepository;
        const updateTransactions: Database.IBootstrapTransaction[] = await transactionsRepository.getAssetsByType(
            MarketplaceTransactionType.BridgechainUpdate,
            MarketplaceTransactionGroup,
        );

        if (updateTransactions.length > 1) {
            const updateTransaction: Database.IBootstrapTransaction = updateTransactions.pop();
            const { bridgechainId, seedNodes } = updateTransaction.asset.bridgechainUpdate;
            const bridgechainAttributes: IBridgechainWalletAttributes = businessAttributes.bridgechains[bridgechainId];
            bridgechainAttributes.bridgechainAsset.seedNodes = seedNodes;
        } else {
            // There are equally many bridgechain registrations as bridgechains a wallet posseses in the database.
            // By getting the index of the bridgechainId we can use it as an offset to get
            // the actual registration transaction.
            const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId.toFixed();
            const registrationIndex: number = Object.keys(businessAttributes.bridgechains).indexOf(bridgechainId);

            const bridgechainRegistration: IBridgechainRegistrationAsset = (await app
                .resolvePlugin<Database.IConnection>("database")
                .transactionsRepository.search({
                    parameters: [
                        {
                            field: "senderPublicKey",
                            value: sender.publicKey,
                            operator: Database.SearchOperator.OP_EQ,
                        },
                        {
                            field: "type",
                            value: MarketplaceTransactionType.BridgechainRegistration,
                            operator: Database.SearchOperator.OP_EQ,
                        },
                    ],
                    orderBy: [
                        {
                            direction: "asc",
                            field: "nonce",
                        },
                    ],
                    paginate: {
                        limit: 1,
                        offset: registrationIndex,
                    },
                })).rows[0].asset.bridgechainRegistration;

            const bridgechainAttributes: IBridgechainWalletAttributes = businessAttributes.bridgechains[bridgechainId];
            bridgechainAttributes.bridgechainAsset.seedNodes = bridgechainRegistration.seedNodes;
        }

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
