import { Handler } from "./handler";

export class TransferHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @param {Array} errors
     * @return {Boolean}
     */
    public canApply(wallet, transaction, errors) {
        return super.canApply(wallet, transaction, errors);
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
