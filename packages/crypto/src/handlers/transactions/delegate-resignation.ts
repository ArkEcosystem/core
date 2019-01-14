import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class DelegateResignationHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        const canApply = !!wallet.username;
        if (!canApply) {
            errors.push("Wallet has not registered a username");
        }
        return canApply;
    }

    /**
     * Apply the transaction to the wallet.
     */
    protected apply(wallet: Wallet, transaction: ITransactionData): void {
        //
    }

    /**
     * Revert the transaction from the wallet.
     */
    protected revert(wallet: Wallet, transaction: ITransactionData): void {
        //
    }
}
