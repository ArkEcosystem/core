import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { BusinessIsNotRegisteredError, BusinessIsResignedError } from "../errors";
import { MarketplaceAplicationEvents } from "../events";
import { IBusinessWalletProperty } from "../interfaces";
import { BusinessResignationTransaction } from "../transactions";

export class BusinessResignationTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return BusinessResignationTransaction;
    }

    public dependencies(): ReadonlyArray<any> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const walletProperty = wallet.getAttribute<IBusinessWalletProperty>("business");
            walletProperty.isBusinessResigned = true;
            wallet.setAttribute<IBusinessWalletProperty>("business", walletProperty);
            walletManager.reindex(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        if (!wallet.hasAttribute("business")) {
            throw new BusinessIsNotRegisteredError();
        }

        if (wallet.getAttribute<IBusinessWalletProperty>("business").isBusinessResigned) {
            throw new BusinessIsResignedError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(MarketplaceAplicationEvents.BusinessResigned, transaction.data);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            const wallet: State.IWallet = pool.walletManager.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Business resignation for "${wallet.getAttribute("business")}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setAttribute("business.isBusinessResigned", true);
        walletManager.reindex(sender);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setAttribute("business.isBusinessResigned", false);
        walletManager.reindex(sender);
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
