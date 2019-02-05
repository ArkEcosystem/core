import { Wallet } from "../../models";
import { ITransactionData } from "../../transactions/interfaces";
import { Handler } from "./handler";

export class SecondSignatureHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
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
     */
    protected apply(wallet: Wallet, transaction: ITransactionData): void {
        wallet.secondPublicKey = transaction.asset.signature.publicKey;
    }

    /**
     * Revert the transaction from the wallet.
     */
    protected revert(wallet: Wallet, transaction: ITransactionData): void {
        delete wallet.secondPublicKey;
    }
}
