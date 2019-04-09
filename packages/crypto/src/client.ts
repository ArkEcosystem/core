import { configManager } from "./managers";
import { feeManager } from "./managers";
import { NetworkManager } from "./managers";
import { BuilderFactory } from "./transactions";

export class Client {
    constructor(config?) {
        this.setConfig(config || NetworkManager.findByName("devnet"));
    }

    public setConfig(config) {
        configManager.setConfig(config);
    }

    public getFeeManager() {
        return feeManager;
    }

    public getConfigManager() {
        return configManager;
    }

    public getBuilder() {
        return BuilderFactory;
    }
}

export const client = new Client();
