import { constants, ITransactionData, models } from "@arkecosystem/crypto";

export interface ITransactionService {
    getType(): constants.TransactionTypes | number;

    canBeApplied(data: Readonly<ITransactionData>, wallet: models.Wallet): boolean;
    applyToSender(data: Readonly<ITransactionData>, wallet: models.Wallet): void;
    applyToRecipient(data: Readonly<ITransactionData>, wallet: models.Wallet): void;
    revertForSender(data: Readonly<ITransactionData>, wallet: models.Wallet): void;
    revertForRecipient(data: Readonly<ITransactionData>, wallet: models.Wallet): void;
    apply(data: Readonly<ITransactionData>, wallet: models.Wallet): void;
    revert(data: Readonly<ITransactionData>, wallet: models.Wallet): void;
}
