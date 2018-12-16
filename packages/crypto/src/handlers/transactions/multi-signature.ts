import { Handler } from "./handler";

export class MultiSignatureHandler extends Handler {
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

        if (wallet.multisignature) {
            errors.push("Wallet is already a multi-signature wallet");
            return false;
        }

        const keysgroup = transaction.asset.multisignature.keysgroup;

        if (keysgroup.length < transaction.asset.multisignature.min) {
            errors.push("Specified key count does not meet minimum key count");
            return false;
        }

        if (keysgroup.length !== transaction.signatures.length) {
            errors.push("Specified key count does not equal signature count");
            return false;
        }

        if (!wallet.verifySignatures(transaction, transaction.asset.multisignature)) {
            errors.push("Failed to verify multi-signatures");
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
        wallet.multisignature = transaction.asset.multisignature;
    }

    /**
     * Revert the transaction from the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public revert(wallet, transaction) {
        wallet.multisignature = null;
    }
}
