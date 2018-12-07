import { app } from "@arkecosystem/core-container";

const database = app.resolvePlugin("database");

/**
 * Get a single block from the database
 * @return {Block}
 */
export default (_, { id }) => database.db.blocks.findById(id);
