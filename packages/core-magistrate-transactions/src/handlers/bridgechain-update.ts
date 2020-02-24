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
    PortKeyMustBeValidPackageNameError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";
import { packageNameRegex } from "./utils";

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

                const bridgechainUpdate = transaction.asset.bridgechainUpdate;
                const bridgechainAsset =
                    businessAttributes.bridgechains[bridgechainUpdate.bridgechainId].bridgechainAsset;

                const shallowCloneBridgechainUpdate = { ...bridgechainUpdate };
                delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset
                Object.assign(bridgechainAsset, shallowCloneBridgechainUpdate);

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
        if (!businessAttributes.bridgechains) {
            throw new BridgechainIsNotRegisteredByWalletError();
        }

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

        for (const portKey of Object.keys(bridgechainUpdate.ports || {})) {
            if (!packageNameRegex.test(portKey)) {
                throw new PortKeyMustBeValidPackageNameError();
            }
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
    ): Promise<{ type: string; message: string } | null> {
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
            return {
                type: "ERR_PENDING",
                message: `Bridgechain update for bridgechainId "${bridgechainId}" already in the pool`,
            };
        }

        return null;
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

        const shallowCloneBridgechainUpdate = { ...bridgechainUpdate };
        delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset
        Object.assign(bridgechainAttributes.bridgechainAsset, shallowCloneBridgechainUpdate);

        walletManager.reindex(wallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        // Here we have to "replay" all bridgechain registration and update transactions for this bridgechain id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId;

        const connection: Database.IConnection = app.resolvePlugin<Database.IDatabaseService>("database").connection;

        const dbRegistrationTransactions = await connection.transactionsRepository.search({
            parameters: [
                {
                    field: "senderPublicKey",
                    value: transaction.data.senderPublicKey,
                    operator: Database.SearchOperator.OP_EQ,
                },
                {
                    field: "type",
                    value: Enums.MagistrateTransactionType.BridgechainRegistration,
                    operator: Database.SearchOperator.OP_EQ,
                },
                {
                    field: "typeGroup",
                    value: transaction.data.typeGroup,
                    operator: Database.SearchOperator.OP_EQ,
                },
            ],
        });
        const dbUpdateTransactions = await connection.transactionsRepository.search({
            parameters: [
                {
                    field: "senderPublicKey",
                    value: transaction.data.senderPublicKey,
                    operator: Database.SearchOperator.OP_EQ,
                },
                {
                    field: "type",
                    value: Enums.MagistrateTransactionType.BridgechainUpdate,
                    operator: Database.SearchOperator.OP_EQ,
                },
                {
                    field: "typeGroup",
                    value: transaction.data.typeGroup,
                    operator: Database.SearchOperator.OP_EQ,
                },
            ],
            orderBy: [
                {
                    direction: "asc",
                    field: "nonce",
                },
            ],
        });

        let bridgechainAsset: MagistrateInterfaces.IBridgechainRegistrationAsset;
        for (const dbRegistrationTx of dbRegistrationTransactions.rows) {
            if (dbRegistrationTx.asset.bridgechainRegistration.genesisHash === bridgechainId) {
                bridgechainAsset = dbRegistrationTx.asset
                    .bridgechainRegistration as MagistrateInterfaces.IBridgechainRegistrationAsset;
                break;
            }
        }

        for (const dbUpdateTx of dbUpdateTransactions.rows) {
            const bridgechainUpdateAsset = dbUpdateTx.asset
                .bridgechainUpdate as MagistrateInterfaces.IBridgechainUpdateAsset;
            if (dbUpdateTx.id === transaction.id || bridgechainUpdateAsset.bridgechainId !== bridgechainId) {
                continue;
            }
            delete dbUpdateTx.asset.bridgechainUpdate.bridgechainId; // no need for bridgechainId for bridgechain asset
            Object.assign(bridgechainAsset, bridgechainUpdateAsset);
        }

        businessAttributes.bridgechains[bridgechainId] = { bridgechainAsset };

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
