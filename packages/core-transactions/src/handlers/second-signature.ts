import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import {
    SecondSignatureAlreadyRegisteredError,
    SecondSignatureNotSupportedForMultiSignatureWalletError,
} from "../errors";
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

        if (databaseWalletManager.findByPublicKey(transaction.data.senderPublicKey).multisignature) {
            throw new SecondSignatureNotSupportedForMultiSignatureWalletError();
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

        walletManager.findByPublicKey(transaction.data.senderPublicKey).secondPublicKey =
            transaction.data.asset.signature.publicKey;
    }

    protected revertForSender(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        walletManager.findByPublicKey(transaction.data.senderPublicKey).secondPublicKey = undefined;
    }

    protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }

    protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: Database.IWalletManager): void {
        return;
    }
}
