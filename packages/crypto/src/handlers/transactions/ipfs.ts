import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class IpfsHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        return super.canApply(wallet, transaction, errors);
    }

    /**
     * Apply the transaction to the wallet.
     */
    public apply(wallet: Wallet, transaction: ITransactionData): void {
        //
    }

    /**
     * Revert the transaction from the wallet.
     */
    public revert(wallet: Wallet, transaction: ITransactionData): void {
        //
    }
}
