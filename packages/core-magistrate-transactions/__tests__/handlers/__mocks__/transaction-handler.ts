import { walletRepository } from "./wallet-repository";
import { Container } from "@arkecosystem/core-kernel";
import { transactionReader } from "./transaction-reader";

@Container.injectable()
export class TransactionHandler {
    protected walletRepository = walletRepository;

    public applyToSender(transaction) {}

    public revertForSender(transaction) {}

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
