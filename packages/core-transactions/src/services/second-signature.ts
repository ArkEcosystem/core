import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { constants, ITransactionData, Transaction } from "@arkecosystem/crypto";
import { SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionService } from "./transaction";

export class SecondSignatureTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.SecondSignature;
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
