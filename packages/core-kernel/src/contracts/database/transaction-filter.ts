import { OrTransactionCriteria } from "../shared/criteria";
import { Expression } from "../shared/expressions";

export interface TransactionFilter {
    getCriteriaExpression(...criteria: OrTransactionCriteria[]): Promise<Expression>;
}
