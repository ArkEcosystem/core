import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { formatOrderBy, unserializeTransactions } from "../../helpers";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

/**
 * Useful and common database operations with wallet data.
 */
export const Wallet = {
    /*
     * Get the transactions for a given wallet.
     * @param {Wallet} wallet
     * @param {Object} args
     * @return {Transaction[]}
     */
    async transactions(wallet, args) {
        const { orderBy, filter, ...params } = args;

        const walletOr = (databaseService.connection as any).createCondition("OR", [
            {
                senderPublicKey: wallet.publicKey,
            },
            {
                recipientId: wallet.address,
            },
        ]);

        /* TODO .findAll() method never existed on the TransactionRepository in core-database-postgres. This code would've blown chunks
        const result = await databaseService.connection.transactionsRepository.findAll(
            {
                ...filter,
                orderBy: formatOrderBy(orderBy, "timestamp:DESC"),
                ...walletOr,
                ...params,
            },
            false,
        );*/
        const result = null;
        const rows = result ? result.rows : [];

        return unserializeTransactions(rows);
    },

    /*
     * Get the blocks generated for a given wallet.
     * @param {Wallet} wallet
     * @param {Object} args
     * @return {Block[]}
     */
    blocks(wallet, args) {
        const { orderBy, ...params } = args;

        params.generatorPublickKey = wallet.publicKey;

        /* TODO: .findAll() method never existed on the TransactionRepository in core-database-postgres. This code would've blown chunks
        const result = databaseService.connection.blocksRepository.findAll(
            {
                orderBy: formatOrderBy(orderBy, "height:DESC"),
                ...params,
            },
            false,
        );*/
        const result = null;
        const rows = result ? result.rows : [];
        return rows;
    },
};
