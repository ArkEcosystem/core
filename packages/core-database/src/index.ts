import { defaults } from "./defaults";
import { DatabaseManager } from "./manager";

/**
 * The interface used by concrete implementations.
 * @type {ConnectionInterface}
 */
import { ConnectionInterface } from "./interface";

/**
 * The Wallet Manager.
 * @type {WalletManager}
 */
import { WalletManager } from "./wallet-manager";

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

export { ConnectionInterface, WalletManager };
