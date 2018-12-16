import { configManager as crypto } from "@arkecosystem/crypto";
import axios from "axios";
import { existsSync, readdirSync, writeFileSync } from "fs-extra";
import Joi from "joi";
import get from "lodash/get";
import set from "lodash/set";
import { basename, extname, resolve } from "path";
import { fileLoader, RemoteLoader } from "./loaders";
import { Network } from "./network";

class Config {
    public network: any;
    public peers: any;
    public delegates: any;
    public genesisBlock: any;
    public milestones: any;
    public dynamicFees: any;

    public async setUp(opts) {
        if (opts.remote) {
            const remoteLoader = new RemoteLoader(opts);
            await remoteLoader.setUp();
        }

        const { config, files } = await fileLoader.setUp(Network.setUp(opts));

        for (const [key, value] of Object.entries(files)) {
            this[key] = value;
        }

        this.configureCrypto(config);

        return this;
    }

    public get(key: string, defaultValue: any = null): any {
        return get(this.network, key, defaultValue);
    }

    public set(key: string, value: any): void {
        set(this.network, key, value);
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

        this.network = crypto.all();
        this.milestones = crypto.get("milestones");
        this.dynamicFees = crypto.get("dynamicFees");
    }
}

export const configManager = new Config();
