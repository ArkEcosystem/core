import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container } from "@arkecosystem/core-kernel";

import { app } from "./app";
import { transactionReader } from "./transaction-reader";
import { walletRepository } from "./wallet-repository";

@Container.injectable()
export class TransactionHandler {
    @Container.inject(Container.Identifiers.CryptoManager)
    protected readonly cryptoManager!: CryptoSuite.CryptoManager;

    @Container.inject(Container.Identifiers.TransactionManager)
    protected readonly transactionsManager!: CryptoSuite.TransactionManager;

    protected app = app;
    protected walletRepository = walletRepository;

    public applyToSender(transaction, customWalletRepository?) {}

    public revertForSender(transaction, customWalletRepository?) {}

    public throwIfCannotBeApplied(transaction, wallet, customWalletRepository?) {}

    protected getTransactionReader() {
        return transactionReader;
    }

    protected getConstructor() {
        return {
            staticFee: () => "50000000",
        };
    }
}
