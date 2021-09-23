"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const fs_extra_1 = require("fs-extra");
const got_1 = __importDefault(require("got"));
const path_1 = require("path");
class FileLoader {
    async setUp(opts) {
        if (!opts) {
            throw new Error("Invalid network configuration provided.");
        }
        const files = await this.createFromDirectory();
        const { error } = joi_1.default.validate(files, joi_1.default.object({
            delegates: joi_1.default.object({
                secrets: joi_1.default.array().items(joi_1.default.string()),
                bip38: joi_1.default.string(),
            }),
            peers: joi_1.default.object().required(),
            plugins: joi_1.default.object().required(),
        }).unknown());
        if (error) {
            throw error;
        }
        return files;
    }
    async createFromDirectory() {
        const files = this.getFiles();
        for (const [key, value] of Object.entries(files)) {
            files[key] = require(value);
        }
        await this.buildPeers(files.peers);
        return files;
    }
    getFiles() {
        const basePath = path_1.resolve(process.env.CORE_PATH_CONFIG);
        if (!fs_extra_1.existsSync(basePath)) {
            throw new Error("An invalid configuration was provided or is inaccessible due to it's security settings.");
        }
        for (const file of ["peers.json", "plugins.js"]) {
            const fullPath = `${basePath}/${file}`;
            if (!fs_extra_1.existsSync(fullPath)) {
                throw new Error(`The ${fullPath} file could not be found.`);
            }
        }
        const configTree = {};
        for (const file of fs_extra_1.readdirSync(basePath)) {
            if ([".js", ".json"].includes(path_1.extname(file))) {
                configTree[path_1.basename(file, path_1.extname(file))] = path_1.resolve(basePath, file);
            }
        }
        return configTree;
    }
    async buildPeers(configFile) {
        let fetchedList;
        if (configFile.sources) {
            for (const source of configFile.sources) {
                // Local File...
                if (source.startsWith("/")) {
                    fetchedList = require(source);
                    break;
                }
                // URL...
                try {
                    const { body } = await got_1.default.get(source);
                    fetchedList = JSON.parse(body);
                    break;
                }
                catch (error) {
                    //
                }
            }
        }
        if (fetchedList) {
            if (!configFile.list) {
                configFile.list = [];
            }
            for (const peer of fetchedList) {
                if (!configFile.list.some(seed => seed.ip === peer.ip && seed.port === peer.port)) {
                    configFile.list.push(peer);
                }
            }
            const path = `${path_1.resolve(process.env.CORE_PATH_CONFIG)}/peers.json`;
            fs_extra_1.writeFileSync(path, JSON.stringify(configFile, undefined, 2));
        }
    }
}
exports.FileLoader = FileLoader;
//# sourceMappingURL=file-loader.js.map