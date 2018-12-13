import { configManager } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
import axios from "axios";
import { existsSync, readdirSync, writeFileSync } from "fs-extra";
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
            strictEqual(Number.isInteger(this.network.pubKeyHash), true);
            strictEqual(this.network.nethash.length, 64);
            strictEqual(Number.isInteger(this.network.wif), true);
        } catch (error) {
            throw Error(error.message);
            process.exit(1);
        }
    }
}
