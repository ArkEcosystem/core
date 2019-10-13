import { Contracts } from "@arkecosystem/core-kernel";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { BusinessAlreadyRegisteredError } from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBusinessWalletAttributes } from "../interfaces";
import { MagistrateIndex } from "../wallet-manager";

export class BusinessRegistrationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BusinessRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [
            "business",
            "business.businessAsset",
            "business.transactionId",
            "business.bridgechains",
            "business.resigned",
        ];
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);
                const asset: IBusinessWalletAttributes = {
                    businessAsset: transaction.asset.businessRegistration,
                    businessId: this.getBusinessId(walletRepository),
                };

                wallet.setAttribute<IBusinessWalletAttributes>("business", asset);
                walletRepository.reindex(wallet);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (wallet.hasAttribute("business")) {
            throw new BusinessAlreadyRegisteredError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BusinessRegistered, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: Contracts.State.Wallet = pool.walletRepository.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business registration for "${wallet.getAttribute("business")}" already in the pool`,
            );
            return false;
        }
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const businessAsset: IBusinessWalletAttributes = {
            businessAsset: transaction.data.asset.businessRegistration,
            businessId: this.getBusinessId(walletRepository),
        };

        sender.setAttribute<IBusinessWalletAttributes>("business", businessAsset);
        walletRepository.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.forgetAttribute("business");

        walletRepository.forgetByIndex(MagistrateIndex.Businesses, sender.publicKey);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}

    private getBusinessId(walletRepository: Contracts.State.WalletRepository): Utils.BigNumber {
        return Utils.BigNumber.make(walletRepository.getIndex(MagistrateIndex.Businesses).values().length).plus(1);
    }
}
