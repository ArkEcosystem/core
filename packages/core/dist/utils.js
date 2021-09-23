"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_table3_1 = __importDefault(require("cli-table3"));
const dottie_1 = __importDefault(require("dottie"));
const envfile_1 = __importDefault(require("envfile"));
const fs_extra_1 = require("fs-extra");
const fs_extra_2 = require("fs-extra");
const path_1 = require("path");
exports.renderTable = (head, callback) => {
    const table = new cli_table3_1.default({
        head,
        chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });
    callback(table);
    console.log(table.toString());
};
exports.updateEnvironmentVariables = (envFile, variables) => {
    if (!fs_extra_2.existsSync(envFile)) {
        throw new Error(`No environment file found at ${envFile}`);
    }
    const env = envfile_1.default.parseFileSync(envFile);
    for (const [key, value] of Object.entries(variables)) {
        env[key] = value;
    }
    fs_extra_1.writeFileSync(envFile, envfile_1.default.stringifySync(env));
};
exports.getCliConfig = (flags, paths, defaultValue = {}) => {
    const configPaths = [`${paths.config}/app.js`, path_1.resolve(__dirname, `../bin/config/${flags.network}/app.js`)];
    let configPath;
    for (const path of configPaths) {
        if (fs_extra_2.existsSync(path)) {
            configPath = path;
            break;
        }
    }
    if (!configPath) {
        return defaultValue;
    }
    const key = `cli.${flags.suffix}.run.plugins`;
    const configuration = require(path_1.resolve(configPath));
    if (!dottie_1.default.exists(configuration, key)) {
        return defaultValue;
    }
    return dottie_1.default.get(configuration, key);
};
//# sourceMappingURL=utils.js.map