import { Expression } from "../search";
import { OrBlockCriteria } from "../shared/block-history-service";
import { BlockModel } from "./models";

export interface BlockFilter {
    getExpression(...criteria: OrBlockCriteria[]): Promise<Expression<BlockModel>>;
}
