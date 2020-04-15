import { OrBlockCriteria } from "../shared/criteria";
import { Expression } from "../shared/expressions";

export interface BlockFilter {
    getCriteriaExpression(...criteria: OrBlockCriteria[]): Promise<Expression>;
}
