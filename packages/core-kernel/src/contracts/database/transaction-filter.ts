import { Expression } from "../search";
import { OrTransactionCriteria } from "../shared/transaction-history-service";
import { TransactionModel } from "./models";

export interface TransactionFilter {
    getExpression(...criteria: OrTransactionCriteria[]): Promise<Expression<TransactionModel>>;
}
