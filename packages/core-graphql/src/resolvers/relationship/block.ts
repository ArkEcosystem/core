import { app } from "@arkecosystem/core-kernel";
import { formatOrderBy, unserializeTransactions } from "../../helpers";

const database = app.resolve("database");

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

        const result = await database.transactions.findAll(
            {
                ...filter,
                orderBy: formatOrderBy(orderBy, "timestamp:DESC"),
                ...params,
            },
            false,
        );
        const rows = result ? result.rows : [];

        return unserializeTransactions(rows);
    },

    /**
     * Get the generator wallet for a given block
     * @param {Block} block
     * @return {Wallet}
     */
    generator(block) {
        return database.wallets.findById(block.generatorPublicKey);
    },
};
