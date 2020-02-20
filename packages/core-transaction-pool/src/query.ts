import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";

import { Memory } from "./memory";

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
    private readonly memory!: Memory;

    public getAll(): Contracts.TransactionPool.QueryIterable {
        return new QueryIterable(this.memory.getAll());
    }

    public getAllBySender(senderPublicKey: string): Contracts.TransactionPool.QueryIterable {
        return new QueryIterable(this.memory.getBySender(senderPublicKey));
    }
}
