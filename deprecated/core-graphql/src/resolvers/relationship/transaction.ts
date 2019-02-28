import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

/**
 * Useful and common database operations with transaction data.
 */
export const Transaction = {
    /**
     * Get the block of a transaction
     * @param {Transaction} transaction
     * @return {Block}
     */
    block: transaction => databaseService.connection.blocksRepository.findById(transaction.blockId),

    /**
     * Get the recipient of a transaction
     * @param {Transaction} transaction
     * @return {Wallet}
     */
    recipient: transaction =>
        transaction.recipientId ? databaseService.wallets.findById(transaction.recipientId) : [],

    /**
     * Get the sender of a transaction
     * @param {Transaction} transaction
     * @return {Wallet}
     */
    sender: transaction =>
        transaction.senderPublicKey ? databaseService.wallets.findById(transaction.senderPublicKey) : [],
};
