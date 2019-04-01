import { configManager as crypto } from "@arkecosystem/crypto";
import get from "lodash.get";
import set from "lodash.set";
import { fileLoader } from "./loaders";
import { Network } from "./network";

export class Config {
    private config: Record<string, any>;

    public async setUp(opts) {
        const network = Network.setUp(opts);

        const { files } = await fileLoader.setUp(network);

        this.config = files;

        this.configureCrypto(network);

        return this;
    }

    public all(): any {
        return this.config;
    }

    public get(key: string, defaultValue: any = null): any {
        return get(this.config, key, defaultValue);
    }

    public set(key: string, value: any): void {
        set(this.config, key, value);
    }

    /**
     * Get constants for the specified height.
     */
    public getMilestone(height: number): any {
        return crypto.getMilestone(height);
    }

    /**
     * Configure the @arkecosystem/crypto package.
     * @return {void}
     */
    private configureCrypto(value: any): void {
        crypto.setConfig(value);

        this.config.network = crypto.all();
        this.config.exceptions = crypto.get("exceptions");
        this.config.milestones = crypto.get("milestones");
        this.config.genesisBlock = crypto.get("genesisBlock");
    }
}

export const configManager = new Config();
