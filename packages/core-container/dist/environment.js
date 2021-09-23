"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_paths_1 = __importDefault(require("env-paths"));
const envfile_1 = __importDefault(require("envfile"));
const expand_home_dir_1 = __importDefault(require("expand-home-dir"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
class Environment {
    constructor(variables) {
        this.variables = variables;
    }
    setUp() {
        this.exportPaths();
        this.exportVariables();
    }
    merge(variables) {
        for (const [key, value] of Object.entries(variables)) {
            process.env[key] = value;
        }
    }
    exportPaths() {
        const allowedKeys = ["data", "config", "cache", "log", "temp"];
        const paths = env_paths_1.default(this.variables.token, { suffix: "core" });
        for (const key of allowedKeys) {
            if (paths[key]) {
                const name = `CORE_PATH_${key.toUpperCase()}`;
                let path = path_1.resolve(expand_home_dir_1.default(paths[key]));
                if (this.variables.network) {
                    path += `/${this.variables.network}`;
                }
                if (process.env[name] === undefined) {
                    process.env[name] = path;
                    fs_extra_1.ensureDirSync(path);
                }
            }
        }
    }
    exportVariables() {
        process.env.CORE_TOKEN = this.variables.token;
        // Don't pollute the test environment!
        if (process.env.NODE_ENV === "test") {
            return;
        }
        const envPath = expand_home_dir_1.default(`${process.env.CORE_PATH_CONFIG}/.env`);
        if (fs_extra_1.existsSync(envPath)) {
            this.merge(envfile_1.default.parseFileSync(envPath));
        }
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map