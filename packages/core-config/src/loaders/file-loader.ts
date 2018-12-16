import { configManager } from "@arkecosystem/crypto";
import axios from "axios";
import { existsSync, readdirSync, writeFileSync } from "fs-extra";
import Joi from "joi";
import get from "lodash/get";
import set from "lodash/set";
import { basename, extname, resolve } from "path";
import { schema } from "../schema";

export class FileLoader {
    public network: any;
    public peers: any;
    public delegates: any;
    public genesisBlock: any;
    public milestones: any;
    public dynamicFees: any;

    private options: any;

    /**
     * Make the config instance.
     * @param  {Object} options
     * @return {Loader}
     */
    public async setUp(options: object = {}): Promise<void> {
        this.options = options;

        try {
            const { value, error } = Joi.validate(JSON.parse(process.env.ARK_NETWORK), schema);

            if (error) {
                throw error;
            }

            await this.createFromDirectory();

            configManager.setConfig(value);

            // TODO: change once the config object has been implemented
            this.network = configManager.all();
            this.milestones = configManager.get("milestones");
            this.dynamicFees = configManager.get("dynamicFees");
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }
    }

    public get(key: string, defaultValue: any = null): any {
        // TODO: change to a config object that holds all values
        return get(this.network, key, defaultValue);
    }

    public set(key: string, value: any): void {
        // TODO: change to a config object that holds all values
        set(this.network, key, value);
    }

    /**
     * Get constants for the specified height.
     * @param  {Number} height
     * @return {void}
     */
    public getMilestone(height: number): void {
        return configManager.getMilestone(height);
    }

    /**
     * Load and bind the config.
     * @return {void}
     */
    private async createFromDirectory(): Promise<void> {
        const files: Record<string, string> = this.getFiles();

        this.createBindings(files);

        await this.buildPeers(files.peers);
    }

    /**
     * Bind the config values to the instance.
     * @param  {Object} files
     * @return {void}
     */
    private createBindings(files: Record<string, string>): void {
        for (const [key, value] of Object.entries(files)) {
            this[key] = require(value);
        }
    }

    /**
     * Get all config files.
     * @return {Object}
     */
    private getFiles(): Record<string, string> {
        const basePath = resolve(process.env.ARK_PATH_CONFIG);

        if (!existsSync(basePath)) {
            throw new Error("An invalid configuration was provided or is inaccessible due to it's security settings.");
        }

        const configTree = {};
        for (const file of readdirSync(basePath)) {
            if ([".js", ".json"].includes(extname(file))) {
                configTree[basename(file, extname(file))] = resolve(basePath, file);
            }
        }

        return configTree;
    }

    /**
     * Build the peer list either from a local file, remote file or object.
     * @param  {String} configFile
     * @return {void}
     */
    private async buildPeers(configFile: string): Promise<void> {
        if (this.peers.sources) {
            const output = require(configFile);

            for (const source of this.peers.sources) {
                // Local File...
                if (source.startsWith("/")) {
                    output.list = require(source);

                    writeFileSync(configFile, JSON.stringify(output, null, 2));

                    break;
                }

                // URL...
                try {
                    const response = await axios.get(source);

                    output.list = response.data;

                    writeFileSync(configFile, JSON.stringify(output, null, 2));

                    break;
                } catch (error) {
                    //
                }
            }
        }
    }
}
