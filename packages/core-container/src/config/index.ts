import { configManager as crypto } from "@arkecosystem/crypto";
import get from "lodash/get";
import set from "lodash/set";
import { fileLoader, RemoteLoader } from "./loaders";
import { Network } from "./network";

class Config {
    private config: Record<string, any>;

    public async setUp(opts) {
        if (opts.remote) {
            const remoteLoader = new RemoteLoader(opts);
            await remoteLoader.setUp();
        }

        const { config, files } = await fileLoader.setUp(Network.setUp(opts));

        for (const [key, value] of Object.entries(files)) {
            this.config[key] = value;
        }

        this.configureCrypto(config);

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
     * @param  {Number} height
     * @return {void}
     */
    public getMilestone(height: number): void {
        return crypto.getMilestone(height);
    }

    /**
     * Configure the @arkecosystem/crypto package.
     * @return {void}
     */
    private configureCrypto(value: any): void {
        crypto.setConfig(value);

        this.config.network = crypto.all();
        this.config.milestones = crypto.get("milestones");
        this.config.dynamicFees = crypto.get("dynamicFees");
    }
}

export const configManager = new Config();
