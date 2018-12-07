import { app } from "@arkecosystem/core-container";

const database = app.resolvePlugin("database");

/**
 * Get a single transaction from the database
 * @return {Transaction}
 */
export default async (_, { id }) => database.db.transactions.findById(id);
