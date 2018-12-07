import { formatOrderBy } from "../../../helpers";
import { blocks } from "../../../repositories";

/**
 * Get multiple blocks from the database
 * @return {Block[]}
 */
export default async (_, args) => {
  const { orderBy, filter } = args;

  const order = formatOrderBy(orderBy, "height:desc");

  const result = await blocks.findAll({ ...filter, orderBy: order });

  return result ? result.rows : [];
};
