import { Transaction } from "@packages/crypto/src/transactions";
import { Contracts } from "@packages/core-kernel";
import { Interfaces } from "@packages/crypto";

let mockTransactions: Partial<Transaction>[];

export const setMockTransactions = (transactions: Partial<Interfaces.ITransaction>[]) => {
    mockTransactions = transactions;
};

class CustomQueryIterable implements Partial<Contracts.TransactionPool.QueryIterable> {
    public transactions: Interfaces.ITransaction[];

    constructor(items) {
        this.transactions = items
    }

    public *[Symbol.iterator](): Iterator<Interfaces.ITransaction> {
        for (const transaction of this.transactions) {
            yield transaction;
        }
    }

    whereId(id: any): any {
        return this;
    }

    has(): boolean {
        return this.transactions.length > 0;
    }

    first(): Interfaces.ITransaction {
        return this.transactions[0]
    }
}

export const transactionPoolQuery: Partial<Contracts.TransactionPool.Query> = {
    getAllFromHighestPriority: () : Contracts.TransactionPool.QueryIterable => {
        return new CustomQueryIterable(mockTransactions) as unknown as Contracts.TransactionPool.QueryIterable;
    }
};
