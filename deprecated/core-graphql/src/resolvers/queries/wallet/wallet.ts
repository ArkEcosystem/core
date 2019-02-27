import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

/**
 * Get a single wallet from the database
 * @return {Wallet}
 */
export async function wallet(_, args: any) {
    const param = args.address || args.publicKey || args.username;
    return databaseService.wallets.findById(param);
}
