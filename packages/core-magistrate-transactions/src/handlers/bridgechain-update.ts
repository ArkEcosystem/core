import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";

export class BridgechainUpdateTransactionHandler extends MagistrateTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainUpdateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

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
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
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
        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset.bridgechainUpdate;
        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId];

        if (!bridgechainAttributes) {
            throw new BridgechainIsNotRegisteredByWalletError();
        }

        if (bridgechainAttributes.resigned) {
            throw new BridgechainIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MagistrateApplicationEvents.BridgechainUpdate, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        const { bridgechainId }: { bridgechainId: string } = data.asset.bridgechainUpdate;

        const bridgechainUpdatesInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(
                Enums.MagistrateTransactionType.BridgechainUpdate,
                Enums.MagistrateTransactionGroup,
            ),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        if (
            bridgechainUpdatesInPool.some(
                update =>
                    update.senderPublicKey === data.senderPublicKey &&
                    update.asset.bridgechainUpdate.bridgechainId === bridgechainId,
            )
        ) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Bridgechain update for bridgechainId "${bridgechainId}" already in the pool`,
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

        const wallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset.bridgechainUpdate;

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId];
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

        const connection: Database.IConnection = app.resolvePlugin<Database.IDatabaseService>("database").connection;
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());
        const updateTransactions: Database.IBootstrapTransaction[] = [];
        while (reader.hasNext()) {
            updateTransactions.push(...(await reader.read()));
        }

        if (updateTransactions.length > 1) {
            const updateTransaction: Database.IBootstrapTransaction = updateTransactions.pop();
            const { bridgechainId, seedNodes } = updateTransaction.asset.bridgechainUpdate;
            const bridgechainAttributes: IBridgechainWalletAttributes = businessAttributes.bridgechains[bridgechainId];
            bridgechainAttributes.bridgechainAsset.seedNodes = seedNodes;
        } else {
            // There are equally many bridgechain registrations as bridgechains a wallet posseses in the database.
            // By getting the index of the bridgechainId we can use it as an offset to get
            // the actual registration transaction.
            const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId;
            const registrationIndex: number = Object.keys(businessAttributes.bridgechains).indexOf(bridgechainId);

            const bridgechainRegistration: MagistrateInterfaces.IBridgechainRegistrationAsset = (await app
                .resolvePlugin<Database.IDatabaseService>("database")
                .connection.transactionsRepository.search({
                    parameters: [
                        {
                            field: "senderPublicKey",
                            value: sender.publicKey,
                            operator: Database.SearchOperator.OP_EQ,
                        },
                        {
                            field: "type",
                            value: Enums.MagistrateTransactionType.BridgechainRegistration,
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
