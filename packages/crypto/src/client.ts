import { transactionBuilder } from "./builder";
import { configManager } from "./managers/config";
import { feeManager } from "./managers/fee";
import { NetworkManager } from "./managers/network";

export class Client {
    /**
     * @constructor
     * @param {Object} config
     */
    constructor(config?) {
        this.setConfig(config || NetworkManager.findByName("devnet"));
    }

    /**
     * Set config for client.
     * @param {Object} config
     */
    public setConfig(config) {
        configManager.setConfig(config);
    }

    /**
     * Get fee manager.
     * @return {FeeManager}
     */
    public getFeeManager() {
        return feeManager;
    }

    /**
     * Get config manager.
     * @return {ConfigManager}
     */
    public getConfigManager() {
        return configManager;
    }

    /**
     * Get transaction builder.
     * @return {TransactionBuilder}
     */
    public getBuilder() {
        return transactionBuilder;
    }
}

const client = new Client();
export { client };
