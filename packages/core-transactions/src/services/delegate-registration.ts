import { constants, models, Transaction } from "@arkecosystem/crypto";
import { WalletUsernameEmptyError, WalletUsernameNotEmptyError } from "../errors";
import { TransactionService } from "./transaction";

export class DelegateRegistrationTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.DelegateRegistration;
    }

    public canBeApplied(transaction: Transaction, wallet: models.Wallet): boolean {
        const { data } = transaction;
        const { username } = data.asset.delegate;
        if (!username) {
            throw new WalletUsernameEmptyError();
        }

        if (wallet.username) {
            throw new WalletUsernameNotEmptyError();
        }

        return super.canBeApplied(transaction, wallet);
    }

    public apply(transaction: Transaction, wallet: models.Wallet): void {
        const { data } = transaction;
        wallet.username = data.asset.delegate.username;
    }

    public revert(transaction: Transaction, wallet: models.Wallet): void {
        wallet.username = null;
    }
}
