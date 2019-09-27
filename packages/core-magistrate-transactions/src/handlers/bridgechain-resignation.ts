import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { BridgechainResignationTransaction } from "@arkecosystem/core-magistrate-crypto";
import { Interfaces as MagistrateInterfaces } from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import {
    BridgechainIsNotRegisteredError,
    BridgechainIsResignedError,
    BusinessIsResignedError,
    WalletIsNotBusinessError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BridgechainRegistrationTransactionHandler } from "./bridgechain-registration";

export class BridgechainResignationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BridgechainResignationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BridgechainRegistrationTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["business.bridgechians.bridgechian.resigned"];
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions: Database.IBootstrapTransaction[] = await connection.transactionsRepository.getAssetsByType(
            this.getConstructor().type,
            this.getConstructor().typeGroup,
        );
        for (const transaction of transactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );

            const bridgechainAsset =
                businessAttributes.bridgechains[transaction.asset.bridgechainResignation.bridgechainId];
            bridgechainAsset.resigned = true;

            wallet.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
            walletManager.reindex(wallet);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
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

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;
        const bridgechainAttributes: IBridgechainWalletAttributes =
            businessAttributes.bridgechains[bridgechainResignation.bridgechainId];
        if (!bridgechainAttributes) {
            throw new BridgechainIsNotRegisteredError();
        }

        if (bridgechainAttributes.resigned) {
            throw new BridgechainIsResignedError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MagistrateApplicationEvents.BridgechainResigned, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Bridgechain resignation for "${wallet.getAttribute("business")}" already in the pool`,
            );
            return false;
        }
        return true;
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

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;
        businessAttributes.bridgechains[bridgechainResignation.bridgechainId].resigned = true;
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

        const bridgechainResignation: MagistrateInterfaces.IBridgechainResignationAsset =
            transaction.data.asset.bridgechainResignation;
        businessAttributes.bridgechains[bridgechainResignation.bridgechainId].resigned = false;
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
