import { defaults } from "./defaults";
import { DatabaseManager } from "./manager";

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
export const plugin = {
  pkg: require("../package.json"),
  defaults,
  alias: "databaseManager",
  async register(container, options) {
    container.resolvePlugin("logger").info("Starting Database Manager");

    return new DatabaseManager();
  },
};

/**
 * The interface used by concrete implementations.
 * @type {ConnectionInterface}
 */
export * from "./interface";

/**
 * The Wallet Manager.
 * @type {WalletManager}
 */
export * from "./wallet-manager";
