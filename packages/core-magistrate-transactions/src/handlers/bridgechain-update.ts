import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
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

@Container.injectable()
export class BridgechainUpdateTransactionHandler extends MagistrateTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainUpdateTransaction;
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );

            const shallowCloneBridgechainUpdate = { ...transaction.asset.bridgechainUpdate };
            const bridgechainId = shallowCloneBridgechainUpdate.bridgechainId;
            delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset

            businessAttributes.bridgechains![bridgechainId].bridgechainAsset = {
                ...businessAttributes.bridgechains![bridgechainId].bridgechainAsset,
                ...shallowCloneBridgechainUpdate,
            };

            this.walletRepository.reindex(wallet);
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

        if (wallet.hasAttribute("business.resigned")) {
            throw new BusinessIsResignedError();
        }

        Utils.assert.defined<MagistrateInterfaces.IBridgechainUpdateAsset>(transaction.data.asset?.bridgechainUpdate);

        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        if (!businessAttributes.bridgechains) {
            throw new BridgechainIsNotRegisteredByWalletError();
        }

        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset.bridgechainUpdate;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

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

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainUpdate, transaction.data);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const bridgechainId: string = transaction.data.asset!.bridgechainUpdate.bridgechainId;
        const hasUpdate: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate(t => t.data.asset?.bridgechainUpdate.bridgechainId === bridgechainId)
            .has();

        if (hasUpdate) {
            throw new Contracts.TransactionPool.PoolError(
                `Bridgechain update for bridgechainId "${bridgechainId}" already in the pool`,
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

        const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        Utils.assert.defined<MagistrateInterfaces.IBridgechainUpdateAsset>(transaction.data.asset?.bridgechainUpdate);

        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset.bridgechainUpdate;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId];

        const shallowCloneBridgechainUpdate = { ...bridgechainUpdate };
        delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset
        bridgechainAttributes.bridgechainAsset = {
            ...bridgechainAttributes.bridgechainAsset,
            ...shallowCloneBridgechainUpdate,
        };

        walletRepository.reindex(wallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);
        Utils.assert.defined<object>(transaction.data.asset);
        Utils.assert.defined<number>(transaction.data.typeGroup);

        // Here we have to "replay" all bridgechain registration and update transactions for this bridgechain id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        Utils.assert.defined<string>(sender.publicKey);

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId;

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
                        value: Enums.MagistrateTransactionType.BridgechainRegistration,
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
                        value: Enums.MagistrateTransactionType.BridgechainUpdate,
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

        let bridgechainAsset: MagistrateInterfaces.IBridgechainRegistrationAsset | undefined = undefined;
        for (const dbRegistrationTx of dbRegistrationTransactions.rows) {
            if (dbRegistrationTx.asset.bridgechainRegistration.genesisHash === bridgechainId) {
                bridgechainAsset = dbRegistrationTx.asset
                    .bridgechainRegistration as MagistrateInterfaces.IBridgechainRegistrationAsset;
                break;
            }
        }
        Utils.assert.defined<MagistrateInterfaces.IBridgechainRegistrationAsset>(bridgechainAsset);

        for (const dbUpdateTx of dbUpdateTransactions.rows) {
            const bridgechainUpdateAsset = dbUpdateTx.asset
                .bridgechainUpdate as MagistrateInterfaces.IBridgechainUpdateAsset;
            if (dbUpdateTx.id === transaction.id || bridgechainUpdateAsset.bridgechainId !== bridgechainId) {
                continue;
            }
            delete bridgechainUpdateAsset.bridgechainId; // no need for bridgechainId for bridgechain asset
            bridgechainAsset = {
                ...bridgechainAsset,
                ...bridgechainUpdateAsset,
            };
        }

        Utils.assert.defined<object>(businessAttributes.bridgechains);
        businessAttributes.bridgechains[bridgechainId] = { bridgechainAsset };

        walletRepository.reindex(sender);
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
