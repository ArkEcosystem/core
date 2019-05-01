import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionHandler } from "./transaction";

export class SecondSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.SecondSignatureRegistrationTransaction;
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Database.IWallet,
        databaseWalletManager: Database.IWalletManager,
    ): boolean {
        if (wallet.secondPublicKey) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        return super.canBeApplied(transaction, wallet, databaseWalletManager);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        return true;
    }

    protected applyToSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const { data } = transaction;
        const sender = walletManager.findByPublicKey(data.senderPublicKey);
        sender.secondPublicKey = data.asset.signature.publicKey;
    }

    protected revertForSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const { data } = transaction;
        const sender = walletManager.findByPublicKey(data.senderPublicKey);
        sender.secondPublicKey = null;
    }

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }
}
