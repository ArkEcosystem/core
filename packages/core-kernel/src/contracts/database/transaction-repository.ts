import { Expression, Options, Ordering, Page, Pagination } from "../search";
import { TransactionModel } from "./models";

export type TransactionExpression = Expression<TransactionModel>;
export type TransactionsPage = Page<TransactionModel>;

export interface TransactionRepository {
    getTransaction(expression: TransactionExpression): Promise<TransactionModel | undefined>;

    getTransactions(ordering: Ordering, expression: TransactionExpression): Promise<TransactionModel[]>;

    getTransactionsStream(ordering: Ordering, expression: TransactionExpression): AsyncIterable<TransactionModel>;

    getTransactionsPage(
        options: Options,
        pagination: Pagination,
        ordering: Ordering,
        expression: TransactionExpression,
    ): Promise<TransactionsPage>;
}
