import { constants, models, Transaction } from "@arkecosystem/crypto";

export interface ITransactionService {
    getType(): constants.TransactionTypes | number;

    canBeApplied(transaction: Transaction, wallet: models.Wallet): boolean;
    applyToSender(transaction: Transaction, wallet: models.Wallet): void;
    applyToRecipient(transaction: Transaction, wallet: models.Wallet): void;
    revertForSender(transaction: Transaction, wallet: models.Wallet): void;
    revertForRecipient(transaction: Transaction, wallet: models.Wallet): void;
    apply(transaction: Transaction, wallet: models.Wallet): void;
    revert(transaction: Transaction, wallet: models.Wallet): void;
}
