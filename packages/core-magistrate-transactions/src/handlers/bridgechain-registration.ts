import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import {
    BridgechainAlreadyRegisteredError,
    BusinessIsResignedError,
    GenesisHashAlreadyRegisteredError,
    PortKeyMustBeValidPackageNameError,
    WalletIsNotBusinessError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BusinessRegistrationTransactionHandler } from "./business-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";
import { packageNameRegex } from "./utils";

export class BridgechainRegistrationTransactionHandler extends MagistrateTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["business.bridgechains.bridgechain"];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                    "business",
                );
                if (!businessAttributes.bridgechains) {
                    businessAttributes.bridgechains = {};
                }

                const bridgechainId: string = transaction.asset.bridgechainRegistration.genesisHash;
                businessAttributes.bridgechains[bridgechainId] = {
                    bridgechainAsset: transaction.asset.bridgechainRegistration,
                };

                wallet.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
                walletManager.reindex(wallet);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }

        if (wallet.getAttribute<boolean>("business.resigned") === true) {
            throw new BusinessIsResignedError();
        }

        const { data }: Interfaces.ITransaction = transaction;
        const bridgechains: Record<string, IBridgechainWalletAttributes> = wallet.getAttribute("business.bridgechains");

        if (
            bridgechains &&
            Object.values(bridgechains).some(
                bridgechain =>
                    bridgechain.bridgechainAsset.name.toLowerCase() ===
                    data.asset.bridgechainRegistration.name.toLowerCase(),
            )
        ) {
            throw new BridgechainAlreadyRegisteredError();
        }

        if (bridgechains && bridgechains[data.asset.bridgechainRegistration.genesisHash]) {
            throw new GenesisHashAlreadyRegisteredError();
        }

        for (const portKey of Object.keys(data.asset.bridgechainRegistration.ports)) {
            if (!packageNameRegex.test(portKey)) {
                throw new PortKeyMustBeValidPackageNameError();
            }
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MagistrateApplicationEvents.BridgechainRegistered, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return null;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );
        if (!businessAttributes.bridgechains) {
            businessAttributes.bridgechains = {};
        }

        const bridgechainId: string = transaction.data.asset.bridgechainRegistration.genesisHash;
        businessAttributes.bridgechains[bridgechainId] = {
            bridgechainAsset: transaction.data.asset.bridgechainRegistration,
        };

        sender.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
        walletManager.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        const bridgechainId: string = Object.keys(businessAttributes.bridgechains).pop();
        delete businessAttributes.bridgechains[bridgechainId];

        walletManager.reindex(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
