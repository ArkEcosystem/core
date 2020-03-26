import { Transaction } from "@arkecosystem/crypto/src/transactions";
import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

let mockTransactions: Partial<Transaction>[];

export const setMockTransactions = (transactions: Partial<Interfaces.ITransaction>[]) => {
    mockTransactions = transactions;
};

class CustomQueryIterable implements Partial<Contracts.TransactionPool.QueryIterable> {
    public transactions: Interfaces.ITransaction[];

    constructor(items) {
        this.transactions = items;
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
        return this.transactions[0];
    }
}

export const instance: Partial<Contracts.TransactionPool.Query> = {
    getFromHighestPriority(): Contracts.TransactionPool.QueryIterable {
        return (new CustomQueryIterable(mockTransactions) as unknown) as Contracts.TransactionPool.QueryIterable;
    },
};
