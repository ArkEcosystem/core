import { TransactionTypes } from "../../constants";
import { Wallet } from "../../models";
import { ITransactionData } from "../../transactions/interfaces";
import { DelegateRegistrationHandler } from "./delegate-registration";
import { DelegateResignationHandler } from "./delegate-resignation";
import { Handler } from "./handler";
import { IpfsHandler } from "./ipfs";
import { MultiPaymentHandler } from "./multi-payment";
import { MultiSignatureHandler } from "./multi-signature";
import { SecondSignatureHandler } from "./second-signature";
import { TimelockTransferHandler } from "./timelock-transfer";
import { TransferHandler } from "./transfer";
import { VoteHandler } from "./vote";

class TransactionHandler {
    public handlers: { [x in TransactionTypes]: typeof Handler };

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
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        return this.getHandler(transaction).canApply(wallet, transaction, errors);
    }

    /**
     * Associate this wallet as the sender of a transaction.
     */
    public applyTransactionToSender(wallet: Wallet, transaction: ITransactionData): void {
        this.getHandler(transaction).applyTransactionToSender(wallet, transaction);
    }

    /**
     * Add transaction balance to this wallet.
     */
    public applyTransactionToRecipient(wallet: Wallet, transaction: ITransactionData): void {
        this.getHandler(transaction).applyTransactionToRecipient(wallet, transaction);
    }

    /**
     * Remove this wallet as the sender of a transaction.
     */
    public revertTransactionForSender(wallet: Wallet, transaction: ITransactionData): void {
        this.getHandler(transaction).revertTransactionForSender(wallet, transaction);
    }

    /**
     * Remove transaction balance from this wallet.
     */
    public revertTransactionForRecipient(wallet: Wallet, transaction: ITransactionData): void {
        this.getHandler(transaction).revertTransactionForRecipient(wallet, transaction);
    }

    private getHandler(transaction: ITransactionData): Handler {
        return new (this.handlers[transaction.type] as any)();
    }
}

export const transactionHandler = new TransactionHandler();
