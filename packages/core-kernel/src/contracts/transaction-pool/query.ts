import { Interfaces, Transactions } from "@arkecosystem/crypto";

export type Predicate = (transaction: Interfaces.ITransaction) => boolean;

export interface Query {
    all(): QueryIterable;
    allFromLowestPriority(): QueryIterable;
    allFromHighestPriority(): QueryIterable;
    allFromSender(senderPublicKey: string): QueryIterable;
}

export interface QueryIterable extends Iterable<Interfaces.ITransaction> {
    whenPredicate(predicate: Predicate): QueryIterable;
    whenId(id: string): QueryIterable;
    whenType(type: number): QueryIterable;
    whenTypeGroup(typeGroup: number): QueryIterable;
    whenVersion(version: number): QueryIterable;
    whenInternalType(internalType: Transactions.InternalTransactionType): QueryIterable;
    whenKind(transaction: Interfaces.ITransaction): QueryIterable;

    has(): boolean;
    first(): Interfaces.ITransaction;
}
