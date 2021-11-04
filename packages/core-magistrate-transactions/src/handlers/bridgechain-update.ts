import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
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

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

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
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<MagistrateInterfaces.IBridgechainUpdateAsset>(transaction.asset?.bridgechainUpdate);

            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes =
                wallet.getAttribute<IBusinessWalletAttributes>("business");

            const shallowCloneBridgechainUpdate = { ...transaction.asset.bridgechainUpdate };
            const bridgechainId = shallowCloneBridgechainUpdate.bridgechainId;
            // @ts-ignore
            delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset

            businessAttributes.bridgechains![bridgechainId].bridgechainAsset = {
                ...businessAttributes.bridgechains![bridgechainId].bridgechainAsset,
                ...shallowCloneBridgechainUpdate,
            };

            this.walletRepository.index(wallet);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new BusinessIsNotRegisteredError();
        }

        if (wallet.hasAttribute("business.resigned")) {
            throw new BusinessIsResignedError();
        }

        AppUtils.assert.defined<MagistrateInterfaces.IBridgechainUpdateAsset>(
            transaction.data.asset?.bridgechainUpdate,
        );

        const businessAttributes: IBusinessWalletAttributes =
            wallet.getAttribute<IBusinessWalletAttributes>("business");

        if (!businessAttributes.bridgechains) {
            throw new BridgechainIsNotRegisteredByWalletError();
        }

        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset.bridgechainUpdate;

        AppUtils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

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

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainUpdate, transaction.data);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const bridgechainId: string = transaction.data.asset!.bridgechainUpdate.bridgechainId;
        const hasUpdate: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.bridgechainUpdate.bridgechainId === bridgechainId)
            .has();

        if (hasUpdate) {
            throw new Contracts.TransactionPool.PoolError(
                `Bridgechain update for bridgechainId "${bridgechainId}" already in the pool`,
                "ERR_PENDING",
            );
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes =
            wallet.getAttribute<IBusinessWalletAttributes>("business");

        const bridgechainUpdate: MagistrateInterfaces.IBridgechainUpdateAsset =
            transaction.data.asset!.bridgechainUpdate; // Assertion check inside super.applyToSender

        AppUtils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainUpdate.bridgechainId];

        const shallowCloneBridgechainUpdate = { ...bridgechainUpdate };
        // @ts-ignore
        delete shallowCloneBridgechainUpdate.bridgechainId; // we don't want id in wallet bridgechain asset
        bridgechainAttributes.bridgechainAsset = {
            ...bridgechainAttributes.bridgechainAsset,
            ...shallowCloneBridgechainUpdate,
        };

        this.walletRepository.index(wallet);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<object>(transaction.data.asset);
        AppUtils.assert.defined<number>(transaction.data.typeGroup);

        // Here we have to "replay" all bridgechain registration and update transactions for this bridgechain id
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(sender.getPublicKey());

        const businessAttributes: IBusinessWalletAttributes =
            sender.getAttribute<IBusinessWalletAttributes>("business");
        const bridgechainId: string = transaction.data.asset.bridgechainUpdate.bridgechainId;

        const bridgechainTransactions = await this.transactionHistoryService.findManyByCriteria([
            {
                senderPublicKey: sender.getPublicKey()!,
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BridgechainRegistration,
                asset: { bridgechainRegistration: { genesisHash: bridgechainId } },
            },
            {
                senderPublicKey: sender.getPublicKey()!,
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BridgechainUpdate,
                asset: { bridgechainUpdateAsset: { bridgechainId: bridgechainId } },
            },
        ]);

        const bridgechainAsset = bridgechainTransactions[0].asset!.bridgechainRegistration;
        for (const updateTransaction of bridgechainTransactions.slice(1)) {
            if (updateTransaction.id === transaction.id) {
                break;
            }
            Object.assign(bridgechainAsset, updateTransaction.asset!.bridgechainUpdate);
        }
        delete bridgechainAsset.bridgechainId;

        AppUtils.assert.defined<object>(businessAttributes.bridgechains);
        businessAttributes.bridgechains[bridgechainId] = { bridgechainAsset };

        this.walletRepository.index(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
