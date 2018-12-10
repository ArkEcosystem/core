import sumBy from "lodash/sumBy";
import { Bignum } from "../../utils/bignum";
import { Handler } from "./handler";

export class MultiPaymentHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @param {Array} errors
     * @return {Boolean}
     */
    public canApply(wallet, transaction, errors) {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        const amount = sumBy(transaction.asset.payments, (payment: any) => payment.amount.toFixed());

        const canApply =
            +wallet.balance
                .minus(amount)
                .minus(transaction.fee)
                .toFixed() >= 0;
        if (!canApply) {
            errors.push("Insufficient balance in the wallet");
        }
        return canApply;
    }

    /**
     * Apply the transaction to the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public apply(wallet, transaction) {
        //
    }

    /**
     * Revert the transaction from the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public revert(wallet, transaction) {
        //
    }
}
