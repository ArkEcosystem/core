import { crypto } from "../../crypto";
import { configManager } from "../../managers";
import { ITransactionData, Wallet } from "../../models";
import { transactionValidator } from "../../validation";

export abstract class Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        const validationResult = transactionValidator.validate(transaction);

        if (validationResult.fails) {
            errors.push(validationResult.fails.message);
            return false;
        }

        if (wallet.multisignature) {
            return false;
        }

        if (
            wallet.balance
                .minus(transaction.amount)
                .minus(transaction.fee)
                .isLessThan(0)
        ) {
            errors.push("Insufficient balance in the wallet");
            return false;
        }

        if (!(transaction.senderPublicKey.toLowerCase() === wallet.publicKey.toLowerCase())) {
            errors.push('wallet "publicKey" does not match transaction "senderPublicKey"');
            return false;
        }

        if (!wallet.secondPublicKey && (transaction.secondSignature || transaction.signSignature)) {
            // Accept invalid second signature fields prior the applied patch.
            if (configManager.getMilestone().ignoreInvalidSecondSignatureField) {
                return true;
            }

            errors.push("Invalid second-signature field");
            return false;
        }

        // TODO: this can blow up if 2nd phrase and other transactions are in the wrong order
        if (wallet.secondPublicKey && !crypto.verifySecondSignature(transaction, wallet.secondPublicKey)) {
            errors.push("Failed to verify second-signature");
            return false;
        }

        return true;
    }

    /**
     * Associate this wallet as the sender of a transaction.
     */
    public applyTransactionToSender(wallet: Wallet, transaction: ITransactionData): void {
        if (
            transaction.senderPublicKey.toLowerCase() === wallet.publicKey.toLowerCase() ||
            crypto.getAddress(transaction.senderPublicKey) === wallet.address
        ) {
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);

            this.apply(wallet, transaction);

            wallet.dirty = true;
        }
    }

    /**
     * Remove this wallet as the sender of a transaction.
     */
    public revertTransactionForSender(wallet: Wallet, transaction: ITransactionData): void {
        if (
            transaction.senderPublicKey.toLowerCase() === wallet.publicKey.toLowerCase() ||
            crypto.getAddress(transaction.senderPublicKey) === wallet.address
        ) {
            wallet.balance = wallet.balance.plus(transaction.amount).plus(transaction.fee);

            this.revert(wallet, transaction);

            wallet.dirty = true;
        }
    }

    /**
     * Add transaction balance to this wallet.
     */
    public applyTransactionToRecipient(wallet: Wallet, transaction: ITransactionData): void {
        if (transaction.recipientId === wallet.address) {
            wallet.balance = wallet.balance.plus(transaction.amount);
            wallet.dirty = true;
        }
    }

    /**
     * Remove transaction balance from this wallet.
     */
    public revertTransactionForRecipient(wallet: Wallet, transaction: ITransactionData): void {
        if (transaction.recipientId === wallet.address) {
            wallet.balance = wallet.balance.minus(transaction.amount);
            wallet.dirty = true;
        }
    }

    protected abstract apply(wallet: Wallet, transaction: ITransactionData): void;

    protected abstract revert(wallet: Wallet, transaction: ITransactionData): void;
}
