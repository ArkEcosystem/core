import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { BusinessIsResignedError, WalletIsNotBusinessError } from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { MagistrateIndex } from "../wallet-manager";
import { BusinessRegistrationTransactionHandler } from "./business-registration";

export class BridgechainRegistrationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["business.bridgechains.bridgechain"];
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

                const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                    "business",
                );
                if (!businessAttributes.bridgechains) {
                    businessAttributes.bridgechains = {};
                }

                const bridgechainId: Utils.BigNumber = this.getBridgechainId(walletRepository);
                businessAttributes.bridgechains[bridgechainId.toFixed()] = {
                    bridgechainId,
                    bridgechainAsset: transaction.asset.bridgechainRegistration,
                };

                wallet.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
                walletRepository.reindex(wallet);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }

        if (wallet.getAttribute<boolean>("business.resigned") === true) {
            throw new BusinessIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.Events.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainRegistered, transaction.data);
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
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        if (!businessAttributes.bridgechains) {
            businessAttributes.bridgechains = {};
        }

        const bridgechainId: Utils.BigNumber = this.getBridgechainId(walletRepository);
        businessAttributes.bridgechains[bridgechainId.toFixed()] = {
            bridgechainId,
            bridgechainAsset: AppUtils.assert.defined(transaction.data.asset!.bridgechainRegistration),
        };

        sender.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
        walletRepository.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(
            AppUtils.assert.defined(transaction.data.senderPublicKey),
        );

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        const bridgechains: Record<string, IBridgechainWalletAttributes> = AppUtils.assert.defined(
            businessAttributes.bridgechains,
        );

        const bridgechainId: string = AppUtils.assert.defined(Object.keys(bridgechains).pop());

        delete bridgechains[bridgechainId];

        walletRepository.reindex(sender);
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

    private getBridgechainId(walletRepository: Contracts.State.WalletRepository): Utils.BigNumber {
        return Utils.BigNumber.make(walletRepository.getIndex(MagistrateIndex.Bridgechains).values().length).plus(1);
    }
}
