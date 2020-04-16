import { OrTransactionCriteria } from "../shared/criteria";
import { WhereExpression } from "../shared/expressions";

export interface TransactionFilter {
    getWhereExpression(criteria: OrTransactionCriteria): Promise<WhereExpression>;
}
