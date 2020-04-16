import { OrBlockCriteria } from "../shared/criteria";
import { WhereExpression } from "../shared/expressions";

export interface BlockFilter {
    getWhereExpression(criteria: OrBlockCriteria): Promise<WhereExpression>;
}
