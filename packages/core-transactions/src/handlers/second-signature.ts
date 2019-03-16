import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    ITransactionData,
    SecondSignatureRegistrationTransaction,
    Transaction,
    TransactionConstructor,
} from "@arkecosystem/crypto";
import { SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionHandler } from "./transaction";

export class SecondSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return SecondSignatureRegistrationTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        if (wallet.secondPublicKey) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.secondPublicKey = transaction.data.asset.signature.publicKey;
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.secondPublicKey = null;
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.ITransactionGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }
}
