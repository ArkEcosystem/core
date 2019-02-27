import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
export async function transaction(_, { id }) {
    return app.resolvePlugin<Database.IDatabaseService>("database").connection.transactionsRepository.findById(id);
}
