import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

import { One } from "../index";

@Container.injectable()
export class TransferTransactionHandler extends One.TransferTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.TransferTransaction;
    }

    public async bootstrap(): Promise<void> {
        const transactions = await this.transactionRepository.findReceivedTransactions();
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByAddress(transaction.recipientId);
            wallet.increaseBalance(Utils.BigNumber.make(transaction.amount));
        }
    }
}
