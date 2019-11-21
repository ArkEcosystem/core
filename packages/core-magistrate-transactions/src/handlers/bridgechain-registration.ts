import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import {
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { BusinessIsResignedError, WalletIsNotBusinessError, BridgechainAlreadyRegisteredError } from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { MagistrateIndex } from "../wallet-indexes";
import { BusinessRegistrationTransactionHandler } from "./business-registration";

@Container.injectable()
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
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();

        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );
            if (!businessAttributes.bridgechains) {
                businessAttributes.bridgechains = {};
            }

            const bridgechainId: Utils.BigNumber = this.getBridgechainId(this.walletRepository);
            businessAttributes.bridgechains[bridgechainId.toFixed()] = {
                bridgechainId,
                bridgechainAsset: transaction.asset.bridgechainRegistration,
            };

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

        if (wallet.hasAttribute("business.resigned")) {
            throw new BusinessIsResignedError();
        }

        const { data }: Interfaces.ITransaction = transaction;
        const bridgechains: Record<string, IBridgechainWalletAttributes> = wallet.getAttribute("business.bridgechains");

        if (
            bridgechains &&
            Object.values(bridgechains).some(bridgechain => {
                return bridgechain.bridgechainAsset.name === data!.asset!.bridgechainRegistration.name;
            })
        ) {
            throw new BridgechainAlreadyRegisteredError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
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
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        if (!businessAttributes.bridgechains) {
            businessAttributes.bridgechains = {};
        }

        AppUtils.assert.defined<MagistrateInterfaces.IBridgechainRegistrationAsset>(
            transaction.data.asset?.bridgechainRegistration,
        );

        const bridgechainId: Utils.BigNumber = this.getBridgechainId(walletRepository);
        businessAttributes.bridgechains[bridgechainId.toFixed()] = {
            bridgechainId,
            bridgechainAsset: transaction.data.asset.bridgechainRegistration,
        };

        sender.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
        walletRepository.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        AppUtils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainId: string | undefined = Object.keys(businessAttributes.bridgechains).pop();

        AppUtils.assert.defined<string>(bridgechainId);

        delete businessAttributes.bridgechains[bridgechainId];

        walletRepository.reindex(sender);
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

    private getBridgechainId(walletRepository: Contracts.State.WalletRepository): Utils.BigNumber {
        return Utils.BigNumber.make(walletRepository.getIndex(MagistrateIndex.Bridgechains).values().length).plus(1);
    }
}
