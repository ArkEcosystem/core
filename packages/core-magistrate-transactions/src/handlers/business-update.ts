import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { BusinessIsNotRegisteredError, BusinessIsResignedError } from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBusinessWalletAttributes } from "../interfaces";
import { BusinessRegistrationTransactionHandler } from "./business-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";

export class BusinessUpdateTransactionHandler extends MagistrateTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BusinessUpdateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
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

                const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = wallet.getAttribute<
                    IBusinessWalletAttributes
                >("business").businessAsset;
                const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.asset
                    .businessUpdate as MagistrateInterfaces.IBusinessUpdateAsset;

                wallet.setAttribute("business.businessAsset", {
                    ...businessWalletAsset,
                    ...businessUpdate,
                });
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

        if (wallet.getAttribute<IBusinessWalletAttributes>("business").resigned) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MagistrateApplicationEvents.BusinessUpdate, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string, message: string } | null> {
        if (
            await pool.senderHasTransactionsOfType(
                data.senderPublicKey,
                Enums.MagistrateTransactionType.BusinessUpdate,
                Enums.MagistrateTransactionGroup,
            )
        ) {
            const wallet: State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            return {
                type: "ERR_PENDING",
                message: `Business update for "${wallet.getAttribute("business")}" already in the pool`,
            }
        }

        return null;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;
        const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.data.asset.businessUpdate;

        sender.setAttribute("business.businessAsset", {
            ...businessWalletAsset,
            ...businessUpdate,
        });
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        // Here we have to "replay" all business registration and update transactions
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);

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
                    value: Enums.MagistrateTransactionType.BusinessRegistration,
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
                    value: Enums.MagistrateTransactionType.BusinessUpdate,
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

        const businessWalletAsset = dbRegistrationTransactions.rows[0].asset
            .businessRegistration as MagistrateInterfaces.IBusinessRegistrationAsset;

        for (const dbUpdateTx of dbUpdateTransactions.rows) {
            if (dbUpdateTx.id === transaction.id) {
                continue;
            }
            Object.assign(businessWalletAsset, dbUpdateTx.asset
                .businessUpdate as MagistrateInterfaces.IBusinessUpdateAsset);
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
