import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { formatOrderBy, unserializeTransactions } from "../../helpers";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

/**
 * Useful and common database operations with block data.
 */
export const Block = {
    /**
     * Get the transactions for a given block
     * @param {Block}: block
     * @param {Object}: args
     * @return {Transaction[]}
     */
    async transactions(block, args) {
        const { orderBy, filter, ...params } = args;

        /* .findAll() method never existed on the TransactionRepository in core-database-postgres. This code would've blown chunks
        const result = await database.connection.transactionsRepository.findAll(
            {
                ...filter,
                orderBy: formatOrderBy(orderBy, "timestamp:DESC"),
                ...params,
            },
            false,
        );*/
        const result = null;
        const rows = result ? result.rows : [];

        return unserializeTransactions(rows);
    },

    /**
     * Get the generator wallet for a given block
     * @param {Block} block
     * @return {Wallet}
     */
    generator(block) {
        return databaseService.wallets.findById(block.generatorPublicKey);
    },
};
