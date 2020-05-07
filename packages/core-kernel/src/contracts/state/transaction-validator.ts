import { Interfaces } from "@arkecosystem/crypto";

export interface TransactionValidator {
    validate(transaction: Interfaces.ITransaction<Interfaces.ITransactionData>): Promise<void>;
}

export type TransactionValidatorFactory = () => TransactionValidator;
