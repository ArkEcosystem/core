import { formatOrderBy } from "../../../helpers";
import { transactions } from "../../../repositories";

/**
 * Get multiple transactions from the database
 * @return {Transaction[]}
 */
export default async (root, args) => {
  const { orderBy, filter, limit } = args;
  const order = formatOrderBy(orderBy, "timestamp:desc");
  const result = await transactions.findAll({ ...filter, orderBy: order, limit });
  return result ? result.rows : [];
};
