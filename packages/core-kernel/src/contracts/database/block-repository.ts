import { Expression, Options, Ordering, Page, Pagination } from "../search";
import { BlockModel } from "./models";

export type BlockExpression = Expression<BlockModel>;
export type BlocksPage = Page<BlockModel>;

export interface BlockRepository {
    getBlock(expression: BlockExpression): Promise<BlockModel | undefined>;

    getBlocks(ordering: Ordering, expression: BlockExpression): Promise<BlockModel[]>;

    getBlocksStream(ordering: Ordering, expression: BlockExpression): AsyncIterable<BlockModel>;

    getBlocksPage(
        options: Options,
        pagination: Pagination,
        ordering: Ordering,
        expression: BlockExpression,
    ): Promise<BlocksPage>;
}
