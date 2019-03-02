import { constants, models, Transaction } from "@arkecosystem/crypto";
import { SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionService } from "./transaction";

export class SecondSignatureTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.SecondSignature;
    }

    public canBeApplied(transaction: Transaction, wallet: models.Wallet): boolean {
        if (wallet.secondPublicKey) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        return super.canBeApplied(transaction, wallet);
    }

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        wallet.secondPublicKey = transaction.data.asset.signature.publicKey;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        wallet.secondPublicKey = null;
    }
}
