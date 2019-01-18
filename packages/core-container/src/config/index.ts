import { configManager as crypto, HashAlgorithms } from "@arkecosystem/crypto";
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

        // Calculate milestone hash
        const milestonesBuffer = Buffer.from(JSON.stringify(this.config.milestones));
        this.config.milestoneHash = HashAlgorithms.sha256(milestonesBuffer)
            .slice(0, 8)
            .toString("hex");
    }
}

export const configManager = new Config();
