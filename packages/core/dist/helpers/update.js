"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_ux_1 = __importDefault(require("cli-ux"));
const execa_1 = require("execa");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const latest_version_1 = __importDefault(require("latest-version"));
const path_1 = require("path");
const semver_1 = __importDefault(require("semver"));
const config_1 = require("./config");
const getLatestVersion = async (name, channel) => {
    try {
        const version = await latest_version_1.default(name, { version: channel });
        return version;
    }
    catch (error) {
        return undefined;
    }
};
const ensureCacheFile = (config) => {
    fs_extra_1.ensureDirSync(config.cacheDir);
    const fileName = path_1.join(config.cacheDir, "update");
    fs_1.closeSync(fs_1.openSync(fileName, "w"));
    return fileName;
};
exports.installFromChannel = async (pkg, channel) => {
    const { stdout, stderr } = execa_1.sync(`yarn global add ${pkg}@${channel}`, { shell: true });
    if (stderr) {
        console.error(stderr);
    }
    console.log(stdout);
};
exports.getRegistryChannel = (config) => {
    const channels = ["next"];
    let channel = "latest";
    for (const item of channels) {
        if (config.version.includes(`-${item}`)) {
            channel = item;
        }
    }
    return channel;
};
exports.needsRefresh = (config) => {
    const cacheFile = ensureCacheFile(config);
    try {
        const { mtime } = fs_1.statSync(cacheFile);
        const staleAt = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);
        return staleAt < new Date();
    }
    catch (err) {
        return true;
    }
};
exports.checkForUpdates = async ({ config, error, warn }) => {
    const state = {
        ready: false,
        name: config.name,
        currentVersion: config.version,
        channel: config_1.configManager.get("channel"),
    };
    if (fs_extra_1.existsSync(path_1.join(__dirname, "../../../..", ".git"))) {
        if (!process.env.CORE_DEVELOPER_MODE) {
            warn(`You are using a git clone for developers. Please install core via yarn for auto-updates.`);
        }
        return state;
    }
    try {
        const cacheFile = ensureCacheFile(config);
        cli_ux_1.default.action.start(`Checking for updates`);
        const latestVersion = await getLatestVersion(state.name, state.channel);
        cli_ux_1.default.action.stop();
        if (latestVersion === undefined) {
            error(`We were unable to find any releases for the "${state.channel}" channel.`);
            return state;
        }
        if (semver_1.default.gt(latestVersion, config.version)) {
            return {
                ...state,
                ...{
                    ready: true,
                    updateVersion: latestVersion,
                    cache: cacheFile,
                },
            };
        }
    }
    catch (err) {
        error(err.message);
    }
    finally {
        cli_ux_1.default.action.stop();
    }
    return state;
};
//# sourceMappingURL=update.js.map