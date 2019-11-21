import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Transactions as MagistrateTransactions, Enums } from "@arkecosystem/core-magistrate-crypto";
import { Interfaces as MagistrateInterfaces } from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import {
    BridgechainIsNotRegisteredError,
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
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainResignationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
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

        Utils.assert.defined<MagistrateInterfaces.IBridgechainResignationAsset>(
            transaction.data.asset?.bridgechainResignation,
        );

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;

        Utils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainResignation.bridgechainId.toString()];

        if (!bridgechainAttributes) {
            throw new BridgechainIsNotRegisteredError();
        }

        if (bridgechainAttributes.resigned) {
            throw new BridgechainIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainResigned, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        (pool as any).poolWalletManager.findByPublicKey(data.senderPublicKey);
        const { bridgechainId }: { bridgechainId: number } = data.asset!.bridgechainResignation;

        const bridgechainResignationsInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(
                Enums.MagistrateTransactionType.BridgechainResignation,
                Enums.MagistrateTransactionGroup,
            ),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        if (
            bridgechainResignationsInPool.some(
                resignation =>
                    resignation.senderPublicKey === data.senderPublicKey &&
                    resignation.asset!.bridgechainResignation.bridgechainId === bridgechainId,
            )
        ) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Bridgechain resignation for bridgechainId "${bridgechainId}" already in the pool`);

            return false;
        }

        return true;
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

        businessAttributes.bridgechains[bridgechainResignation.bridgechainId.toString()].resigned = true;
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

        businessAttributes.bridgechains[bridgechainResignation.bridgechainId.toString()].resigned = false;
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> { }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> { }
}
