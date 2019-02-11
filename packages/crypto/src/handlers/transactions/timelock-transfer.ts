import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class TimelockTransferHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        return super.canApply(wallet, transaction, errors);
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
