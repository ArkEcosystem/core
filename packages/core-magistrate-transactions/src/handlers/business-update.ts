import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import {
    Enums,
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
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

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

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
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<MagistrateInterfaces.IBusinessUpdateAsset>(transaction.asset?.businessUpdate);

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
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new BusinessIsNotRegisteredError();
        }

        if (wallet.getAttribute<IBusinessWalletAttributes>("business").resigned) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BusinessUpdate, transaction.data);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const hasSender: boolean = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();

        if (hasSender) {
            throw new Contracts.TransactionPool.PoolError(`Business update already in the pool`, "ERR_PENDING");
        }
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;

        AppUtils.assert.defined<MagistrateInterfaces.IBusinessUpdateAsset>(transaction.data.asset?.businessUpdate);

        const businessUpdate: MagistrateInterfaces.IBusinessUpdateAsset = transaction.data.asset.businessUpdate;

        sender.setAttribute("business.businessAsset", {
            ...businessWalletAsset,
            ...businessUpdate,
        });
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);
        AppUtils.assert.defined<number>(transaction.data.typeGroup);

        // Here we have to "replay" all business registration and update transactions
        // (except the current one being reverted) to rebuild previous wallet state.
        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        AppUtils.assert.defined<string>(sender.getPublicKey());

        const businessTransactions = await this.transactionHistoryService.findManyByCriteria([
            {
                senderPublicKey: sender.getPublicKey()!,
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BusinessRegistration,
            },
            {
                senderPublicKey: sender.getPublicKey()!,
                typeGroup: Enums.MagistrateTransactionGroup,
                type: Enums.MagistrateTransactionType.BusinessUpdate,
            },
        ]);

        const businessWalletAsset = businessTransactions[0].asset!.businessRegistration;
        for (const updateTransaction of businessTransactions.slice(1)) {
            if (updateTransaction.id === transaction.id) {
                break;
            }
            Object.assign(businessWalletAsset, updateTransaction.asset!.businessUpdate);
        }

        sender.setAttribute("business.businessAsset", businessWalletAsset);
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
