import { Interfaces } from "@arkecosystem/crypto";

export interface TransactionValidator {
    validate(transaction: Interfaces.ITransaction): Promise<void>;
}

export type TransactionValidatorFactory = () => TransactionValidator;
