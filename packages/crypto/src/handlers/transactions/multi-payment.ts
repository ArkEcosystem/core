import sumBy from "lodash/sumBy";
import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class MultiPaymentHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        const amount = sumBy(transaction.asset.payments, (payment: any) => payment.amount.toFixed());

        if (
            wallet.balance
                .minus(amount)
                .minus(transaction.fee)
                .isLessThan(0)
        ) {
            errors.push("Insufficient balance in the wallet to transfer all payments");
            return false;
        }

        return true;
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
