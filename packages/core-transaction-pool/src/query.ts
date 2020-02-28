import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";

import { Comparator, IteratorMany } from "./utils";

class QueryIterable implements Contracts.TransactionPool.QueryIterable {
    public transactions: Iterable<Interfaces.ITransaction>;
    public predicate?: Contracts.TransactionPool.QueryPredicate;

    public constructor(
        transactions: Iterable<Interfaces.ITransaction>,
        predicate?: Contracts.TransactionPool.QueryPredicate,
    ) {
        this.transactions = transactions;
        this.predicate = predicate;
    }

    public *[Symbol.iterator](): Iterator<Interfaces.ITransaction> {
        for (const transaction of this.transactions) {
            if (!this.predicate || this.predicate(transaction)) {
                yield transaction;
            }
        }
    }

    public wherePredicate(predicate: Contracts.TransactionPool.QueryPredicate): QueryIterable {
        return new QueryIterable(this, predicate);
    }

    public whereId(id: string): QueryIterable {
        return this.wherePredicate(t => t.id === id);
    }

    public whereType(type: Enums.TransactionType): QueryIterable {
        return this.wherePredicate(t => t.type === type);
    }

    public whereTypeGroup(typeGroup: Enums.TransactionTypeGroup): QueryIterable {
        return this.wherePredicate(t => t.typeGroup === typeGroup);
    }

    public whereVersion(version: number): QueryIterable {
        return this.wherePredicate(t => t.data.version === version);
    }

    public whereKind(transaction: Interfaces.ITransaction): QueryIterable {
        return this.wherePredicate(t => t.type === transaction.type && t.typeGroup === transaction.typeGroup);
    }

    public has(): boolean {
        for (const _ of this) {
            return true;
        }
        return false;
    }

    public first(): Interfaces.ITransaction {
        for (const transaction of this) {
            return transaction;
        }
        throw new Error("Transaction not found");
    }
}

@Container.injectable()
export class Query implements Contracts.TransactionPool.Query {
    @Container.inject(Container.Identifiers.TransactionPoolMemory)
    private readonly memory!: Contracts.TransactionPool.Memory;

    public getAll(): QueryIterable {
        const iterable: Iterable<Interfaces.ITransaction> = function*(this: Query) {
            for (const senderState of this.memory.getSenderStates()) {
                for (const transaction of senderState.getTransactionsFromLatestNonce()) {
                    yield transaction;
                }
            }
        }.bind(this)();

        return new QueryIterable(iterable);
    }

    public getAllBySender(senderPublicKey: string): QueryIterable {
        const iterable: Iterable<Interfaces.ITransaction> = function*(this: Query) {
            if (this.memory.hasSenderState(senderPublicKey)) {
                const transactions = this.memory.getSenderState(senderPublicKey).getTransactionsFromEarliestNonce();
                for (const transaction of transactions) {
                    yield transaction;
                }
            }
        }.bind(this)();

        return new QueryIterable(iterable);
    }

    public getAllFromLowestPriority(): QueryIterable {
        const iterable = {
            [Symbol.iterator]: () => {
                const comparator: Comparator<Interfaces.ITransaction> = (
                    a: Interfaces.ITransaction,
                    b: Interfaces.ITransaction,
                ) => {
                    return a.data.fee.comparedTo(b.data.fee);
                };

                const iterators: Iterator<Interfaces.ITransaction>[] = Array.from(this.memory.getSenderStates())
                    .map(s => s.getTransactionsFromLatestNonce())
                    .map(i => i[Symbol.iterator]());

                return new IteratorMany<Interfaces.ITransaction>(iterators, comparator);
            },
        };

        return new QueryIterable(iterable);
    }

    public getAllFromHighestPriority(): QueryIterable {
        const iterable = {
            [Symbol.iterator]: () => {
                const comparator: Comparator<Interfaces.ITransaction> = (
                    a: Interfaces.ITransaction,
                    b: Interfaces.ITransaction,
                ) => {
                    return b.data.fee.comparedTo(a.data.fee);
                };

                const iterators: Iterator<Interfaces.ITransaction>[] = Array.from(this.memory.getSenderStates())
                    .map(s => s.getTransactionsFromEarliestNonce())
                    .map(i => i[Symbol.iterator]());

                return new IteratorMany<Interfaces.ITransaction>(iterators, comparator);
            },
        };

        return new QueryIterable(iterable);
    }
}
