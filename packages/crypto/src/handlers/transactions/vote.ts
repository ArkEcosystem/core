import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class VoteHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        const vote = transaction.asset.votes[0];
        if (vote.startsWith("-") && (!wallet.vote || wallet.vote !== vote.slice(1))) {
            if (!wallet.vote) {
                errors.push("Wallet has not voted yet");
            } else {
                errors.push("The unvote public key does not match the currently voted one");
            }

            return false;
        }

        if (vote.startsWith("+") && wallet.vote) {
            errors.push("Wallet has already voted");
            return false;
        }
        return true;
    }

    /**
     * Apply the transaction to the wallet.
     */
    protected apply(wallet: Wallet, transaction: ITransactionData): void {
        const vote = transaction.asset.votes[0];

        if (vote.startsWith("+")) {
            wallet.vote = vote.slice(1);
        }

        if (vote.startsWith("-")) {
            wallet.vote = null;
        }
    }

    /**
     * Revert the transaction from the wallet.
     */
    protected revert(wallet: Wallet, transaction: ITransactionData): void {
        const vote = transaction.asset.votes[0];

        if (vote.startsWith("+")) {
            wallet.vote = null;
        }

        if (vote.startsWith("-")) {
            wallet.vote = vote.slice(1);
        }
    }
}
