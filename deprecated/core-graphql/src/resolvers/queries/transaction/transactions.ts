import { formatOrderBy } from "../../../helpers";
import { transactionRepository } from "../../../repositories";

/**
 * Get multiple transactions from the database
 * @return {Transaction[]}
 */
export async function transactions(_, args: any) {
    const { orderBy, filter, limit } = args;
    const order = formatOrderBy(orderBy, "timestamp:desc");
    const result = await transactionRepository.findAll({ ...filter, orderBy: order, limit });
    return result ? result.rows : [];
}
