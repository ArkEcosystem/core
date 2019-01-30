import { app } from "@arkecosystem/core-kernel";
import { formatOrderBy } from "../../../helpers";

const database = app.resolve("database");

/**
 * Get multiple wallets from the database
 * @return {Wallet[]}
 */
export async function wallets(_, args: any) {
    const { orderBy, filter, ...params } = args;

    const order = formatOrderBy(orderBy, "height:desc");
    const result =
        filter && filter.vote
            ? await database.wallets.findAllByVote(filter.vote, {
                  orderBy: order,
                  ...params,
              })
            : await database.wallets.findAll({ orderBy: order, ...params });

    return result ? result.rows : [];
}
