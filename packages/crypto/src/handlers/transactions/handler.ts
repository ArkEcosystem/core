import assert from "assert";
import { crypto } from "../../crypto";
import { transactionValidator } from "../../validation";

export abstract class Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @param {Array} errors
     * @return {Boolean}
     */
    public canApply(wallet, transaction, errors) {
        const validationResult = transactionValidator.validate(transaction);
        assert.ok(errors instanceof Array);
        if (validationResult.fails) {
            errors.push(validationResult.fails.message);
            return false;
        }

        if (wallet.multisignature) {
            if (!wallet.verifySignatures(transaction, wallet.multisignature)) {
                errors.push("Failed to verify multi-signatures");
                return false;
            }
        }

        const balance = +wallet.balance
            .minus(transaction.amount)
            .minus(transaction.fee)
            .toFixed();
        if (balance < 0) {
            errors.push("Insufficient balance in the wallet");
            return false;
        }
        if (!(transaction.senderPublicKey.toLowerCase() === wallet.publicKey.toLowerCase())) {
            errors.push('wallet "publicKey" does not match transaction "senderPublicKey"');
            return false;
        }

        if (!wallet.secondPublicKey && (transaction.secondSignature || transaction.signSignature)) {
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
     * @param {Wallet} wallet
     * @param {Transaction} transaction
     * @return {void}
     */
    public applyTransactionToSender(wallet, transaction) {
        if (
            transaction.senderPublicKey.toLowerCase() === wallet.publicKey.toLowerCase() ||
            crypto.getAddress(transaction.senderPublicKey) === wallet.address
        ) {
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);

            this.apply(wallet, transaction);

            wallet.dirty = true;
        }
    }

    public abstract apply(wallet: any, transaction: any): any;

    /**
     * Remove this wallet as the sender of a transaction.
     * @param {Wallet} wallet
     * @param {Transaction} transaction
     * @return {void}
     */
    public revertTransactionForSender(wallet, transaction) {
        if (
            transaction.senderPublicKey.toLowerCase() === wallet.publicKey.toLowerCase() ||
            crypto.getAddress(transaction.senderPublicKey) === wallet.address
        ) {
            wallet.balance = wallet.balance.plus(transaction.amount).plus(transaction.fee);

            this.revert(wallet, transaction);

            wallet.dirty = true;
        }
    }

    public abstract revert(wallet: any, transaction: any): any;

    /**
     * Add transaction balance to this wallet.
     * @param {Wallet} wallet
     * @param {Transaction} transaction
     * @return {void}
     */
    public applyTransactionToRecipient(wallet, transaction) {
        if (transaction.recipientId === wallet.address) {
            wallet.balance = wallet.balance.plus(transaction.amount);
            wallet.dirty = true;
        }
    }

    /**
     * Remove transaction balance from this wallet.
     * @param {Wallet} wallet
     * @param {Transaction} transaction
     * @return {void}
     */
    public revertTransactionForRecipient(wallet, transaction) {
        if (transaction.recipientId === wallet.address) {
            wallet.balance = wallet.balance.minus(transaction.amount);
            wallet.dirty = true;
        }
    }
}
