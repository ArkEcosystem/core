import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { formatOrderBy } from "../../../helpers";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

/**
 * Get multiple wallets from the database
 * @return {Wallet[]}
 */
export async function wallets(_, args: any) {
    const { orderBy, filter, ...params } = args;

    const order = formatOrderBy(orderBy, "height:desc");
    const result =
        filter && filter.vote
            ? await databaseService.wallets.findAllByVote(filter.vote, {
                  orderBy: order,
                  ...params,
              })
            : await databaseService.wallets.findAll({ orderBy: order, ...params });

    return result ? result.rows : [];
}
