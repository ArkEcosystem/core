import { Models } from "@arkecosystem/core-database";
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
    @Container.inject(BusinessRegistrationTransactionHandler)
    private readonly businessRegistrationTransactionHandler!: BusinessRegistrationTransactionHandler;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandler> {
        return [this.businessRegistrationTransactionHandler];
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

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        if (
            await pool.senderHasTransactionsOfType(
                data.senderPublicKey!,
                Enums.MagistrateTransactionType.BusinessUpdate,
                Enums.MagistrateTransactionGroup,
            )
        ) {
            const wallet: Contracts.State.Wallet = (pool as any).poolWalletRepository.findByPublicKey(
                data.senderPublicKey,
            );
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business update for "${wallet.getAttribute("business")}" already in the pool`,
            );
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

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        let businessWalletAsset: MagistrateInterfaces.IBusinessRegistrationAsset = sender.getAttribute<
            IBusinessWalletAttributes
        >("business").businessAsset;

        let reader: TransactionReader = this.getTransactionReader();
        const updateTransactions: Models.Transaction[] = await reader.read();

        if (updateTransactions.length > 0) {
            const updateTransaction: Models.Transaction | undefined = updateTransactions.pop();

            Utils.assert.defined<Models.Transaction>(updateTransaction);

            const previousUpdate: MagistrateInterfaces.IBusinessUpdateAsset = updateTransaction.asset.businessUpdate;

            businessWalletAsset = {
                ...businessWalletAsset,
                ...previousUpdate,
            };
        } else {
            reader = this.app
                .resolve<TransactionReader>(TransactionReader)
                .initialize(MagistrateTransactions.BusinessRegistrationTransaction);

            const registerTransactions: Models.Transaction[] = await reader.read();

            const registerTransaction: Models.Transaction | undefined = registerTransactions.pop();

            Utils.assert.defined<Models.Transaction>(registerTransaction);

            const previousRegistration: MagistrateInterfaces.IBusinessRegistrationAsset =
                registerTransaction.asset.businessRegistration;

            businessWalletAsset = {
                ...businessWalletAsset,
                ...previousRegistration,
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
