import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Interfaces as MagistrateInterfaces } from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import {
    BridgechainIsNotRegisteredByWalletError,
    BridgechainIsResignedError,
    BusinessIsResignedError,
    WalletIsNotBusinessError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";

@Container.injectable()
export class BridgechainResignationTransactionHandler extends MagistrateTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainResignationTransaction;
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["business.bridgechains.bridgechain.resigned"];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );

            const bridgechainAsset = businessAttributes.bridgechains![
                transaction.asset.bridgechainResignation.bridgechainId
            ];
            bridgechainAsset.resigned = true;

            wallet.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
            this.walletRepository.reindex(wallet);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }

        const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        if (businessAttributes.resigned) {
            throw new BusinessIsResignedError();
        }
        if (!businessAttributes.bridgechains) {
            throw new BridgechainIsNotRegisteredByWalletError();
        }

        Utils.assert.defined<MagistrateInterfaces.IBridgechainResignationAsset>(
            transaction.data.asset?.bridgechainResignation,
        );

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainResignation.bridgechainId];
        if (!bridgechainAttributes) {
            throw new BridgechainIsNotRegisteredByWalletError();
        }

        if (bridgechainAttributes.resigned) {
            throw new BridgechainIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainResigned, transaction.data);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const bridgechainId: string = transaction.data.asset!.bridgechainResignation.bridgechainId;
        const hasResignation: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate(t => t.data.asset?.bridgechainResignation.bridgechainId === bridgechainId)
            .has();

        if (hasResignation) {
            throw new Contracts.TransactionPool.PoolError(
                `Bridgechain resignation for bridgechainId "${bridgechainId}" already in the pool`,
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

        const businessAttributes: IBusinessWalletAttributes = walletRepository
            .findByPublicKey(transaction.data.senderPublicKey)
            .getAttribute<IBusinessWalletAttributes>("business");

        Utils.assert.defined<MagistrateInterfaces.IBridgechainResignationAsset>(
            transaction.data.asset?.bridgechainResignation,
        );

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        businessAttributes.bridgechains[bridgechainResignation.bridgechainId].resigned = true;
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = walletRepository
            .findByPublicKey(transaction.data.senderPublicKey)
            .getAttribute<IBusinessWalletAttributes>("business");

        Utils.assert.defined<MagistrateInterfaces.IBridgechainResignationAsset>(
            transaction.data.asset?.bridgechainResignation,
        );

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        businessAttributes.bridgechains[bridgechainResignation.bridgechainId].resigned = false;
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
