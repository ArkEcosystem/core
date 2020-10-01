import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

let mockTransactions: Partial<Transactions.Transaction>[] = [];

export const setTransactions = (transactions: Partial<Interfaces.ITransaction>[]) => {
    mockTransactions = transactions;
};

export class CustomQueryIterable implements Partial<Contracts.TransactionPool.QueryIterable> {
    public transactions: Interfaces.ITransaction[];

    public constructor(items) {
        this.transactions = items;
    }

    public *[Symbol.iterator](): Iterator<Interfaces.ITransaction> {
        for (const transaction of this.transactions) {
            yield transaction;
        }
    }

    public whereId(id: any): any {
        return this;
    }

    public has(): boolean {
        return this.transactions.length > 0;
    }

    public first(): Interfaces.ITransaction {
        return this.transactions[0];
    }
}

class TransactionPoolQueryMock implements Partial<Contracts.TransactionPool.Query> {
    public getFromHighestPriority(): Contracts.TransactionPool.QueryIterable {
        return (new CustomQueryIterable(mockTransactions) as unknown) as Contracts.TransactionPool.QueryIterable;
    }
}

export const instance = new TransactionPoolQueryMock();
