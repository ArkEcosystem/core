import { CryptoSuite, Validation } from "@arkecosystem/core-crypto";

export const createDefaultTransactionManager = (
    cryptoManager: CryptoSuite.CryptoManager = CryptoSuite.CryptoManager.createFromPreset("testnet"),
    validator = Validation.Validator.make(cryptoManager),
) => new CryptoSuite.TransactionTools(cryptoManager, validator);
