import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NotSupportedForMultiSignatureWalletError, SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class SecondSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.SecondSignatureRegistrationTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("secondPublicKey", transaction.asset.signature.publicKey);
        }
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        if (wallet.hasSecondSignature()) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        if (databaseWalletManager.findByPublicKey(transaction.data.senderPublicKey).hasMultiSignature()) {
            throw new NotSupportedForMultiSignatureWalletError();
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
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

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        walletManager
            .findByPublicKey(transaction.data.senderPublicKey)
            .setAttribute("secondPublicKey", transaction.data.asset.signature.publicKey);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        walletManager.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("secondPublicKey");
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
