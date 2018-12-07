import { app } from "@arkecosystem/core-container";

const database = app.resolvePlugin("database");

/**
 * Get a single wallet from the database
 * @return {Wallet}
 */
export default async (_, args) => {
  const param = args.address || args.publicKey || args.username;
  return database.wallets.findById(param);
};
