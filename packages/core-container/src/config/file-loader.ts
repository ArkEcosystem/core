import { existsSync, readdirSync, writeFileSync } from "fs-extra";
import got from "got";
import Joi from "joi";
import { basename, extname, resolve } from "path";
import { schemaConfig } from "./schema";

class FileLoader {
    public async setUp(opts): Promise<{ config: Record<string, any>; files: Record<string, string> }> {
        if (!opts) {
            throw new Error("Invalid network configuration provided.");
        }

        const files: Record<string, string> = await this.createFromDirectory();

        const { value, error } = Joi.validate(files, schemaConfig);

        if (error) {
            throw error;
        }

        return { config: value, files };
    }

    private async createFromDirectory(): Promise<Record<string, string>> {
        const files: Record<string, string> = this.getFiles();

        for (const [key, value] of Object.entries(files)) {
            files[key] = require(value);
        }

        await this.buildPeers(files.peers);

        return files;
    }

    private getFiles(): Record<string, string> {
        const basePath: string = resolve(process.env.CORE_PATH_CONFIG);

        if (!existsSync(basePath)) {
            throw new Error("An invalid configuration was provided or is inaccessible due to it's security settings.");
        }

        for (const file of ["peers.json", "plugins.js"]) {
            const fullPath = `${basePath}/${file}`;

            if (!existsSync(fullPath)) {
                throw new Error(`The ${fullPath} file could not be found.`);
            }
        }

        const configTree: Record<string, string> = {};
        for (const file of readdirSync(basePath)) {
            if ([".js", ".json"].includes(extname(file))) {
                configTree[basename(file, extname(file))] = resolve(basePath, file);
            }
        }

        return configTree;
    }

    private async buildPeers(configFile: any): Promise<void> {
        let fetchedList: Array<{ ip: string; port: number }>;

        if (configFile.sources) {
            for (const source of configFile.sources) {
                // Local File...
                if (source.startsWith("/")) {
                    fetchedList = require(source);
                    break;
                }

                // URL...
                try {
                    const { body } = await got.get(source);
                    fetchedList = JSON.parse(body);
                    break;
                } catch (error) {
                    //
                }
            }
        }

        if (fetchedList) {
            if (!configFile.list) {
                configFile.list = [];
            }

            fetchedList.forEach(peer => {
                if (!configFile.list.some(seed => seed.ip === peer.ip && seed.port === peer.port)) {
                    configFile.list.push(peer);
                }
            });

            const path = `${resolve(process.env.CORE_PATH_CONFIG)}/peers.json`;
            writeFileSync(path, JSON.stringify(configFile, null, 2));
        }
    }
}

export const fileLoader = new FileLoader();
