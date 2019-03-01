import { constants, ITransactionData, models } from "@arkecosystem/crypto";
import { WalletUsernameEmptyError, WalletUsernameNotEmptyError } from "../errors";
import { TransactionService } from "./transaction";

export class DelegateRegistrationTransactionService extends TransactionService {
    public getType(): number {
        return constants.TransactionTypes.DelegateRegistration;
    }

    public canBeApplied(data: Readonly<ITransactionData>, wallet: models.Wallet): boolean {
        const { username } = data.asset.delegate;
        if (!username) {
            throw new WalletUsernameEmptyError();
        }

        if (wallet.username) {
            throw new WalletUsernameNotEmptyError();
        }

        return super.canBeApplied(data, wallet);
    }

    public apply(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        wallet.username = data.asset.delegate.username;
    }

    public revert(data: Readonly<ITransactionData>, wallet: models.Wallet): void {
        wallet.username = null;
    }
}
