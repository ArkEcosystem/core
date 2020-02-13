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
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";

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

            const { bridgechainId, seedNodes, ports } = transaction.asset.bridgechainUpdate;
            businessAttributes.bridgechains![bridgechainId].bridgechainAsset.seedNodes = seedNodes;
            businessAttributes.bridgechains![bridgechainId].bridgechainAsset.ports = ports;

            this.walletRepository.reindex(wallet);
        }
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const bridgechainId = transaction.data.asset!.bridgechainUpdate.bridgechainId;

        const duplicate = this.poolQuery
            .allFromSender(transaction.data.senderPublicKey)
            .whenKind(transaction)
            .whenPredicate(t => t.data.asset!.bridgechainUpdate.bridgechainId === bridgechainId)
            .has();

        if (duplicate) {
            // is it necessary?
            throw new Error("Update already in pool");
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

        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        Utils.assert.defined<MagistrateInterfaces.IBridgechainUpdateAsset>(transaction.data.asset?.bridgechainUpdate);

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

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainUpdate, transaction.data);
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
        if (bridgechainUpdate.seedNodes) {
            bridgechainAttributes.bridgechainAsset.seedNodes = bridgechainUpdate.seedNodes;
        }

        if (bridgechainUpdate.ports) {
            bridgechainAttributes.bridgechainAsset.ports = bridgechainUpdate.ports;
        }

        walletRepository.reindex(wallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        const reader: TransactionReader = this.getTransactionReader();
        const updateTransactions: Models.Transaction[] = await reader.read();

        if (updateTransactions.length > 1) {
            const updateTransaction: Models.Transaction | undefined = updateTransactions.pop();

            Utils.assert.defined<Models.Transaction>(updateTransaction);

            Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

            // @ts-ignore Property 'seedNodes' does not exist on type 'IBootstrapTransaction'.
            const { bridgechainId, seedNodes, ports } = updateTransaction.asset.bridgechainUpdate;

            businessAttributes.bridgechains[bridgechainId].bridgechainAsset.seedNodes = seedNodes;
            businessAttributes.bridgechains[bridgechainId].bridgechainAsset.ports = ports;
        } else {
            // There are equally many bridgechain registrations as bridgechains a wallet posseses in the database.
            // By getting the index of the bridgechainId we can use it as an offset to get
            // the actual registration transaction.
            Utils.assert.defined<Utils.BigNumber>(transaction.data.asset?.bridgechainUpdate?.bridgechainId);

            const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId;

            Utils.assert.defined<IBridgechainWalletAttributes>(businessAttributes.bridgechains);

            const registrationIndex: number = Object.keys(businessAttributes.bridgechains).indexOf(bridgechainId);

            Utils.assert.defined<string>(sender.publicKey);

            const transactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.search(
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
                            value: Enums.MagistrateTransactionType.BridgechainRegistration,
                            operator: Repositories.Search.SearchOperator.Equal,
                        },
                    ],
                    orderBy: [
                        {
                            direction: "ASC",
                            field: "nonce",
                        },
                    ],
                    limit: 1,
                    offset: registrationIndex,
                },
            );

            Utils.assert.defined<MagistrateInterfaces.IBridgechainRegistrationAsset>(
                transactions.rows[0].asset?.bridgechainRegistration,
            );

            const bridgechainRegistration: MagistrateInterfaces.IBridgechainRegistrationAsset =
                transactions.rows[0].asset.bridgechainRegistration;

            Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

            businessAttributes.bridgechains[bridgechainId].bridgechainAsset.seedNodes =
                bridgechainRegistration.seedNodes;

            businessAttributes.bridgechains[bridgechainId].bridgechainAsset.ports = bridgechainRegistration.ports;
        }

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
