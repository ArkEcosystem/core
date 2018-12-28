import { transactionBuilder } from "./builder";
import { configManager } from "./managers";
import { feeManager } from "./managers";
import { NetworkManager } from "./managers";

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

export const client = new Client();
