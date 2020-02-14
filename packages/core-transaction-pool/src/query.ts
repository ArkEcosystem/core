import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { IteratorMany } from "./utils";

class QueryIterator implements Iterator<Interfaces.ITransaction> {
    private readonly iter: Iterator<Interfaces.ITransaction>;
    private readonly predicate: Contracts.TransactionPool.Predicate | undefined;

    public constructor(iter: Iterator<Interfaces.ITransaction>, predicate?: Contracts.TransactionPool.Predicate) {
        this.iter = iter;
        this.predicate = predicate;
    }

    public next(value?: any): IteratorResult<Interfaces.ITransaction> {
        let result = this.iter.next();
        while (!result.done) {
            if (!this.predicate || this.predicate(result.value)) {
                return result;
            }
            result = this.iter.next();
        }
        return { done: true, value: undefined };
    }
}

class QueryIterable implements Contracts.TransactionPool.QueryIterable {
    private readonly transactions: Iterable<Interfaces.ITransaction>;
    private readonly predicate: Contracts.TransactionPool.Predicate | undefined;

    public constructor(
        transactions: Iterable<Interfaces.ITransaction>,
        predicate?: Contracts.TransactionPool.Predicate,
    ) {
        this.transactions = transactions;
        this.predicate = predicate;
    }

    public [Symbol.iterator](): Iterator<Interfaces.ITransaction> {
        return new QueryIterator(this.transactions[Symbol.iterator](), this.predicate);
    }

    public whenPredicate(predicate: Contracts.TransactionPool.Predicate): Contracts.TransactionPool.QueryIterable {
        return new QueryIterable(this, predicate);
    }

    public whenId(id: string): Contracts.TransactionPool.QueryIterable {
        return this.whenPredicate(t => t.id === id);
    }

    public whenType(type: number): Contracts.TransactionPool.QueryIterable {
        return this.whenPredicate(t => t.data.type === type);
    }

    public whenTypeGroup(typeGroup: number): Contracts.TransactionPool.QueryIterable {
        return this.whenPredicate(t => t.data.typeGroup === typeGroup);
    }

    public whenVersion(version: number): Contracts.TransactionPool.QueryIterable {
        return this.whenPredicate(t => t.data.version === version);
    }

    public whenInternalType(
        internalType: Transactions.InternalTransactionType,
    ): Contracts.TransactionPool.QueryIterable {
        return this.whenPredicate(
            t => Transactions.InternalTransactionType.from(t.data.type, t.data.typeGroup) === internalType,
        );
    }

    public whenKind(transaction: Interfaces.ITransaction): Contracts.TransactionPool.QueryIterable {
        return this.whenPredicate(
            t =>
                t.data.type === transaction.data.type &&
                t.data.typeGroup === transaction.data.typeGroup &&
                t.data.version === transaction.data.version,
        );
    }

    public has(): boolean {
        return this[Symbol.iterator]().next().done === false;
    }

    public first(): Interfaces.ITransaction {
        const result = this[Symbol.iterator]().next();
        if (result.done) {
            throw new Error("Not found");
        }
        return result.value;
    }
}

@Container.injectable()
export class Query implements Contracts.TransactionPool.Query {
    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Contracts.TransactionPool.Memory;

    public all(): QueryIterable {
        const iterable = function*(this: Query) {
            for (const senderState of this.memory.getSenderStates()) {
                for (const transaction of senderState.getTransactionsFromLatestNonce()) {
                    yield transaction;
                }
            }
        }.bind(this)();

        return new QueryIterable(iterable);
    }

    public allFromLowestPriority(): QueryIterable {
        const iterable = {
            [Symbol.iterator]: () => {
                const comparator = (a: Interfaces.ITransaction, b: Interfaces.ITransaction) => {
                    return a.data.fee.comparedTo(b.data.fee);
                };

                const iterators = Array.from(this.memory.getSenderStates())
                    .map(p => p.getTransactionsFromLatestNonce())
                    .map(i => i[Symbol.iterator]());

                return new IteratorMany<Interfaces.ITransaction>(iterators, comparator);
            },
        };

        return new QueryIterable(iterable);
    }

    public allFromHighestPriority(): QueryIterable {
        const iterable = {
            [Symbol.iterator]: () => {
                const comparator = (a: Interfaces.ITransaction, b: Interfaces.ITransaction) => {
                    return b.data.fee.comparedTo(a.data.fee);
                };

                const iterators = Array.from(this.memory.getSenderStates())
                    .map(p => p.getTransactionsFromEarliestNonce())
                    .map(i => i[Symbol.iterator]());

                return new IteratorMany<Interfaces.ITransaction>(iterators, comparator);
            },
        };

        return new QueryIterable(iterable);
    }

    public allFromSender(senderPublicKey: string): QueryIterable {
        const iterable = function*(this: Query) {
            if (this.memory.hasSenderState(senderPublicKey)) {
                const transactions = this.memory.getSenderState(senderPublicKey).getTransactionsFromEarliestNonce();
                for (const transaction of transactions) {
                    yield transaction;
                }
            }
        }.bind(this)();

        return new QueryIterable(iterable);
    }
}
