import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import {
    BridgechainIsNotRegisteredError,
    BridgechainIsResignedError,
    BusinessIsNotRegisteredError,
    BusinessIsResignedError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";

@Container.injectable()
export class BridgechainUpdateTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainUpdateTransaction;
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

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );

            const { bridgechainId, seedNodes } = transaction.asset.bridgechainUpdate;
            businessAttributes.bridgechains![bridgechainId].bridgechainAsset.seedNodes = seedNodes;

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

        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        Utils.assert.defined<MagistrateInterfaces.IBridgechainUpdateAsset>(transaction.data.asset?.bridgechainUpdate);

        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset.bridgechainUpdate;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId.toFixed()];

        if (!bridgechainAttributes) {
            throw new BridgechainIsNotRegisteredError();
        }

        if (bridgechainAttributes.resigned) {
            throw new BridgechainIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainUpdate, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        return true;
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
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId.toFixed()];
        bridgechainAttributes.bridgechainAsset.seedNodes = bridgechainUpdate.seedNodes;

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
            const { bridgechainId, seedNodes } = updateTransaction.asset.bridgechainUpdate;

            businessAttributes.bridgechains[bridgechainId].bridgechainAsset.seedNodes = seedNodes;
        } else {
            // There are equally many bridgechain registrations as bridgechains a wallet posseses in the database.
            // By getting the index of the bridgechainId we can use it as an offset to get
            // the actual registration transaction.
            Utils.assert.defined<Utils.BigNumber>(transaction.data.asset?.bridgechainUpdate?.bridgechainId);

            const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId.toFixed();

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
