import { formatOrderBy } from "../../../helpers";
import { blockRepository } from "../../../repositories";

/**
 * Get multiple blocks from the database
 * @return {Block[]}
 */
export async function blocks(_, args: any) {
    const { orderBy, filter } = args;

    const order = formatOrderBy(orderBy, "height:desc");

    const result = await blockRepository.findAll({ ...filter, orderBy: order });

    return result ? result.rows : [];
}
