import { app } from "@arkecosystem/core-kernel";

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
export async function transaction(_, { id }) {
    return app.resolvePlugin("database").db.transactions.findById(id);
}
