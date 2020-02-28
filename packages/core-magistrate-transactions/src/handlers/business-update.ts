import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
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

@Container.injectable()
export class BusinessUpdateTransactionHandler extends MagistrateTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BusinessUpdateTransaction;
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);

            const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = wallet.getAttribute<
                IBusinessWalletAttributes
            >("business").businessAsset;
            const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.asset.businessUpdate;

            wallet.setAttribute("business.businessAsset", {
                ...businessWalletAsset,
                ...businessUpdate,
            });
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new BusinessIsNotRegisteredError();
        }

        if (wallet.getAttribute<IBusinessWalletAttributes>("business").resigned) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BusinessUpdate, transaction.data);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const hasSender: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();

        if (hasSender) {
            throw new Contracts.TransactionPool.PoolError(
                `Business update already in the pool`,
                "ERR_PENDING",
                transaction,
            );
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;

        Utils.assert.defined<MagistrateInterfaces.IBusinessUpdateAsset>(transaction.data.asset?.businessUpdate);

        const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.data.asset.businessUpdate;

        sender.setAttribute("business.businessAsset", {
            ...businessWalletAsset,
            ...businessUpdate,
        });
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<number>(transaction.data.typeGroup);

        // Here we have to "replay" all business registration and update transactions
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(sender.publicKey);

        const dbRegistrationTransactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.search(
            {
                criteria: [
                    {
                        field: "senderPublicKey",
                        value: sender.publicKey,
                        operator: Repositories.Search.SearchOperator.Equal,
                    },
                    {
                        field: "type",
                        value: Enums.MagistrateTransactionType.BusinessRegistration,
                        operator: Repositories.Search.SearchOperator.Equal,
                    },
                    {
                        field: "typeGroup",
                        value: transaction.data.typeGroup,
                        operator: Repositories.Search.SearchOperator.Equal,
                    },
                ],
            },
        );
        const dbUpdateTransactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.search(
            {
                criteria: [
                    {
                        field: "senderPublicKey",
                        value: sender.publicKey,
                        operator: Repositories.Search.SearchOperator.Equal,
                    },
                    {
                        field: "type",
                        value: Enums.MagistrateTransactionType.BusinessUpdate,
                        operator: Repositories.Search.SearchOperator.Equal,
                    },
                    {
                        field: "typeGroup",
                        value: transaction.data.typeGroup,
                        operator: Repositories.Search.SearchOperator.Equal,
                    },
                ],
                orderBy: [
                    {
                        direction: "ASC",
                        field: "nonce",
                    },
                ],
            },
        );

        let businessWalletAsset = dbRegistrationTransactions.rows[0].asset
            .businessRegistration as MagistrateInterfaces.IBusinessRegistrationAsset;

        for (const dbUpdateTx of dbUpdateTransactions.rows) {
            if (dbUpdateTx.id === transaction.id) {
                continue;
            }
            businessWalletAsset = {
                ...businessWalletAsset,
                ...(dbUpdateTx.asset.businessUpdate as MagistrateInterfaces.IBusinessUpdateAsset),
            };
        }

        sender.setAttribute("business.businessAsset", businessWalletAsset);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
