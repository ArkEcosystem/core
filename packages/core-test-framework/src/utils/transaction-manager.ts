import { CryptoManager, TransactionsManager } from "@arkecosystem/core-crypto";

import { defaultSchemaValidator } from "./schema-validator";

export const createDefaultTransactionManager = (
    cryptoManager: CryptoManager = CryptoManager.createFromPreset("testnet"),
    validator = defaultSchemaValidator,
) => new TransactionsManager(cryptoManager, validator);
