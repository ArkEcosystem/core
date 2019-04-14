import { Managers } from "@arkecosystem/crypto";
import get from "lodash.get";
import set from "lodash.set";
import { fileLoader } from "./file-loader";
import { Network } from "./network";

export class Config {
    private config: Record<string, any>;
    private readonly cryptoConfig = Managers.configManager;

    public async setUp(opts): Promise<Config> {
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

    public getMilestone(height: number): any {
        return this.cryptoConfig.getMilestone(height);
    }

    private configureCrypto(value: any): void {
        this.cryptoConfig.setConfig(value);

        this.config.network = this.cryptoConfig.all();
        this.config.exceptions = this.cryptoConfig.get("exceptions");
        this.config.milestones = this.cryptoConfig.get("milestones");
        this.config.genesisBlock = this.cryptoConfig.get("genesisBlock");
    }
}

export const configManager = new Config();
