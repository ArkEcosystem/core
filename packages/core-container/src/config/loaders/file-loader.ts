import axios from "axios";
import { existsSync, readdirSync, writeFileSync } from "fs-extra";
import Joi from "joi";
import { basename, extname, resolve } from "path";
import { schemaConfig } from "../schema";

class FileLoader {
    /**
     * Make the config instance.
     * @param  {Object} opts
     * @return {Loader}
     */
    public async setUp(opts) {
        if (!opts) {
            throw new Error("Invalid network configuration provided.");
        }

        const files = await this.createFromDirectory();

        const { value, error } = Joi.validate(files, schemaConfig);

        if (error) {
            throw error;
        }

        return { config: value, files };
    }

    /**
     * Load and bind the config.
     * @return {void}
     */
    private async createFromDirectory() {
        const files: Record<string, string> = this.getFiles();

        for (const [key, value] of Object.entries(files)) {
            files[key] = require(value);
        }

        await this.buildPeers(files.peers);

        return files;
    }

    /**
     * Get all config files.
     * @return {Object}
     */
    private getFiles(): Record<string, string> {
        const basePath = resolve(process.env.CORE_PATH_CONFIG);

        if (!existsSync(basePath)) {
            throw new Error("An invalid configuration was provided or is inaccessible due to it's security settings.");
        }

        for (const file of ["peers.json", "plugins.js"]) {
            const fullPath = `${basePath}/${file}`;

            if (!existsSync(fullPath)) {
                throw new Error(`The ${fullPath} file could not be found.`);
            }
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
    private async buildPeers(configFile: any): Promise<void> {
        if (configFile.sources) {
            for (const source of configFile.sources) {
                // Local File...
                if (source.startsWith("/")) {
                    configFile.list = require(source);

                    writeFileSync(configFile, JSON.stringify(configFile, null, 2));

                    break;
                }

                // URL...
                try {
                    const response = await axios.get(source);

                    configFile.list = response.data;

                    writeFileSync(configFile, JSON.stringify(configFile, null, 2));

                    break;
                } catch (error) {
                    //
                }
            }
        }
    }
}

export const fileLoader = new FileLoader();
