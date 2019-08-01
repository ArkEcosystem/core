import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class HtlcLockTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.HtlcLockTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const lockTransactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        for (const transaction of lockTransactions) {
            const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            const locks = wallet.getAttribute("htlc.locks", {});
            locks[transaction.id] = transaction;
            wallet.setAttribute("htlc.locks", locks);
            const lockedBalance = wallet.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.amount));
            walletManager.reindex(wallet);
        }
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const locks = sender.getAttribute("htlc.locks", {});
        locks[transaction.id] = transaction.data;
        sender.setAttribute("htlc.locks", locks);

        const lockedBalance = sender.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.data.amount));

        walletManager.reindex(sender);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance = sender.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));

        const locks = sender.getAttribute("htlc.locks", {});
        delete locks[transaction.id];
        sender.setAttribute("htlc.locks", locks);

        walletManager.reindex(sender);
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
