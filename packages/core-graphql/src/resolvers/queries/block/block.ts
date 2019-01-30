import { app } from "@arkecosystem/core-kernel";

/**
 * Get a single block from the database
 * @return {Block}
 */
export async function block(_, { id }) {
    return app.resolvePlugin("database").db.blocks.findById(id);
}
