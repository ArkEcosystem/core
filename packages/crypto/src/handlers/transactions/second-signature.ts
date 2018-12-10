import { Handler } from "./handler";

export class SecondSignatureHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @param {Array} errors
     * @return {Boolean}
     */
    public canApply(wallet, transaction, errors) {
        if (wallet.secondPublicKey) {
            errors.push("Wallet already has a second signature");
            return false;
        }

        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        return true;
    }

    /**
     * Apply the transaction to the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public apply(wallet, transaction) {
        wallet.secondPublicKey = transaction.asset.signature.publicKey;
    }

    /**
     * Revert the transaction from the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public revert(wallet, transaction) {
        delete wallet.secondPublicKey;
    }
}
