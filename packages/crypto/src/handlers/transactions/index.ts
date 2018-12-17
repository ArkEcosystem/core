import { TransactionTypes } from "../../constants";

import { DelegateRegistrationHandler } from "./delegate-registration";
import { DelegateResignationHandler } from "./delegate-resignation";
import { IpfsHandler } from "./ipfs";
import { MultiPaymentHandler } from "./multi-payment";
import { MultiSignatureHandler } from "./multi-signature";
import { SecondSignatureHandler } from "./second-signature";
import { TimelockTransferHandler } from "./timelock-transfer";
import { TransferHandler } from "./transfer";
import { VoteHandler } from "./vote";

export class TransactionHandler {
    public handlers: { [x: number]: any };
    /**
     * [constructor description]
     */
    constructor() {
        this.handlers = {
            [TransactionTypes.Transfer]: TransferHandler,
            [TransactionTypes.SecondSignature]: SecondSignatureHandler,
            [TransactionTypes.DelegateRegistration]: DelegateRegistrationHandler,
            [TransactionTypes.Vote]: VoteHandler,
            [TransactionTypes.MultiSignature]: MultiSignatureHandler,
            [TransactionTypes.Ipfs]: IpfsHandler,
            [TransactionTypes.TimelockTransfer]: TimelockTransferHandler,
            [TransactionTypes.MultiPayment]: MultiPaymentHandler,
            [TransactionTypes.DelegateResignation]: DelegateResignationHandler,
        };
    }

    /**
     * [canApply description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @param {Array} errors
     * @return {Boolean}
     */
    public canApply(wallet, transaction, errors) {
        return this.getHandler(transaction).canApply(wallet, transaction, errors);
    }

    /**
     * [apply description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public apply(wallet, transaction) {
        return this.getHandler(transaction).apply(wallet, transaction);
    }

    /**
     * [applyTransactionToSender description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public applyTransactionToSender(wallet, transaction) {
        return this.getHandler(transaction).applyTransactionToSender(wallet, transaction);
    }

    /**
     * [applyTransactionToRecipient description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public applyTransactionToRecipient(wallet, transaction) {
        return this.getHandler(transaction).applyTransactionToRecipient(wallet, transaction);
    }

    /**
     * [revert description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public revert(wallet, transaction) {
        return this.getHandler(transaction).revert(wallet, transaction);
    }

    /**
     * [revertTransactionForSender description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public revertTransactionForSender(wallet, transaction) {
        return this.getHandler(transaction).revertTransactionForSender(wallet, transaction);
    }

    /**
     * [revertTransactionForRecipient description]
     * @param  {Wallet} wallet
     * @param  {Transaction} transaction
     * @return {void}
     */
    public revertTransactionForRecipient(wallet, transaction) {
        return this.getHandler(transaction).revertTransactionForRecipient(wallet, transaction);
    }

    /**
     * [getHandler description]
     * @param {Transaction} transaction
     */
    private getHandler(transaction: any) {
        return new this.handlers[transaction.type]();
    }
}

const transactionHandler = new TransactionHandler();
export { transactionHandler };
