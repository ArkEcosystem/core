import { configManager } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
import axios from "axios";
import { existsSync, readdirSync, writeFileSync } from "fs-extra";
import get from "lodash/get";
import set from "lodash/set";
import { basename, extname, resolve } from "path";

export class Loader {
    public network: any;
    public peers: any;
    public delegates: any;
    public genesisBlock: any;

    private options: any;

    /**
     * Make the config instance.
     * @param  {Object} options
     * @return {Loader}
     */
    public async setUp(options: object = {}): Promise<void> {
        this.options = options;
        this.network = JSON.parse(process.env.ARK_NETWORK);

        await this.__createFromDirectory();

        this._validateConfig();

        configManager.setConfig(this.network);

        // TODO: change once the config object has been implemented
        this.network = configManager.all();
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
    public getConstants(height: number): void {
        return configManager.getConstants(height);
    }

    /**
     * Load and bind the config.
     * @return {void}
     */
    public async __createFromDirectory(): Promise<void> {
        const files: Record<string, string> = this.__getFiles();

        this.__createBindings(files);

        await this.__buildPeers(files.peers);
    }

    /**
     * Bind the config values to the instance.
     * @param  {Object} files
     * @return {void}
     */
    public __createBindings(files: Record<string, string>): void {
        for (const [key, value] of Object.entries(files)) {
            this[key] = require(value);
        }
    }

    /**
     * Get all config files.
     * @return {Object}
     */
    public __getFiles(): Record<string, string> {
        const basePath = resolve(process.env.ARK_PATH_CONFIG);

        if (!existsSync(basePath)) {
            throw new Error("An invalid configuration was provided or is inaccessible due to it's security settings.");
            process.exit(1);
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
    public async __buildPeers(configFile: string): Promise<void> {
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

    /**
     * Validate crucial parts of the configuration.
     * @return {void}
     */
    public _validateConfig(): void {
        try {
            const network = this.network.network;

            strictEqual(Number.isInteger(network.pubKeyHash), true);
            strictEqual(network.nethash.length, 64);
            strictEqual(Number.isInteger(network.wif), true);
        } catch (error) {
            throw Error(error.message);
            process.exit(1);
        }
    }
}
