import { app } from "@arkecosystem/core-kernel";

const database = app.resolve("database");

/**
 * Useful and common database operations with transaction data.
 */
export const Transaction = {
    /**
     * Get the block of a transaction
     * @param {Transaction} transaction
     * @return {Block}
     */
    block: transaction => database.blocks.findById(transaction.blockId),

    /**
     * Get the recipient of a transaction
     * @param {Transaction} transaction
     * @return {Wallet}
     */
    recipient: transaction => (transaction.recipientId ? database.wallets.findById(transaction.recipientId) : []),

    /**
     * Get the sender of a transaction
     * @param {Transaction} transaction
     * @return {Wallet}
     */
    sender: transaction => (transaction.senderPublicKey ? database.wallets.findById(transaction.senderPublicKey) : []),
};
