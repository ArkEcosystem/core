import { Enums, Interfaces } from "@arkecosystem/crypto";

export type QueryPredicate = (transaction: Interfaces.ITransaction) => boolean;

export interface Query {
    getAll(): QueryIterable;
    getAllBySender(senderPublicKey: string): QueryIterable;
    getFromLowestPriority(): QueryIterable;
    getFromHighestPriority(): QueryIterable;
}

export interface QueryIterable extends Iterable<Interfaces.ITransaction> {
    wherePredicate(predicate: QueryPredicate): QueryIterable;
    whereId(id: string): QueryIterable;
    whereType(type: Enums.TransactionType | number): QueryIterable;
    whereTypeGroup(typeGroup: Enums.TransactionTypeGroup | number): QueryIterable;
    whereVersion(version: number): QueryIterable;
    whereKind(transaction: Interfaces.ITransaction): QueryIterable;

    has(): boolean;
    first(): Interfaces.ITransaction;
}
