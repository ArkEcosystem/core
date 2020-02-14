import { Interfaces, Transactions } from "@arkecosystem/crypto";

export type Predicate = (transaction: Interfaces.ITransaction) => boolean;

export interface Query {
    all(): QueryIterable;
    allFromLowestPriority(): QueryIterable;
    allFromHighestPriority(): QueryIterable;
    allFromSender(senderPublicKey: string): QueryIterable;
}

export interface QueryIterable extends Iterable<Interfaces.ITransaction> {
    wherePredicate(predicate: Predicate): QueryIterable;
    whereId(id: string): QueryIterable;
    whereType(type: number): QueryIterable;
    whereTypeGroup(typeGroup: number): QueryIterable;
    whereVersion(version: number): QueryIterable;
    whereInternalType(internalType: Transactions.InternalTransactionType): QueryIterable;
    whereKind(transaction: Interfaces.ITransaction): QueryIterable;

    has(): boolean;
    first(): Interfaces.ITransaction;
}
