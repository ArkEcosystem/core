import { app } from "./app";
import { walletRepository } from "./wallet-repository";

import { transactionReader } from "./transaction-reader";

export class TransactionHandler {
    protected app = app;
    protected walletRepository = walletRepository;

    // tslint:disable-next-line:no-empty
    public applyToSender(transaction) {}

    // tslint:disable-next-line:no-empty
    public revertForSender(transaction) {}

    // tslint:disable-next-line:no-empty
    public throwIfCannotBeApplied(transaction, wallet) {}

    protected getTransactionReader() {
        return transactionReader;
    }

    protected getConstructor() {
        return {
            staticFee: () => "50000000",
        };
    }
}
