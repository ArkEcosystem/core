import { constants, models, Transaction } from "@arkecosystem/crypto";
import { TransactionService } from "./transaction";

export class MultiPaymentTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.MultiPayment;
    }

    public canBeApplied(transaction: Transaction, wallet: models.Wallet): boolean {
        return super.canBeApplied(transaction, wallet);
    }

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        return;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        return;
    }
}
