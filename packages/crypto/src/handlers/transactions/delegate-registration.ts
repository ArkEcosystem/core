import { Wallet } from "../../models";
import { ITransactionData } from "../../transactions/interfaces";
import { Handler } from "./handler";

export class DelegateRegistrationHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        const username = transaction.asset.delegate.username;
        // TODO: Checking whether the username is a lowercase version of itself seems silly. Why can't we mutate it to lowercase
        const canApply = !wallet.username && username && username === username.toLowerCase();
        if (!canApply) {
            errors.push("Wallet already has a registered username");
        }
        return canApply;
    }

    /**
     * Apply the transaction to the wallet.
     */
    protected apply(wallet: Wallet, transaction: ITransactionData): void {
        wallet.username = transaction.asset.delegate.username;
    }

    /**
     * Revert the transaction from the wallet.
     */
    protected revert(wallet: Wallet, transaction: ITransactionData): void {
        wallet.username = null;
    }
}
