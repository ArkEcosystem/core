import { CryptoManager, TransactionTools, Validation } from "@arkecosystem/core-crypto";

export const createDefaultTransactionManager = (
    cryptoManager: CryptoManager = CryptoManager.createFromPreset("testnet"),
    validator = Validation.Validator.make(cryptoManager),
) => new TransactionTools(cryptoManager, validator);
