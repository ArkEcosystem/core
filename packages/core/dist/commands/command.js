"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = __importStar(require("@oclif/command"));
const cli_ux_1 = __importDefault(require("cli-ux"));
const env_paths_1 = __importDefault(require("env-paths"));
const fs_1 = require("fs");
const listr_1 = __importDefault(require("listr"));
const path_1 = require("path");
const prompts_1 = __importDefault(require("prompts"));
const config_1 = require("../helpers/config");
const prompts_2 = require("../helpers/prompts");
const process_manager_1 = require("../process-manager");
// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");
const validNetworks = Object.keys(crypto_1.Networks).filter(network => network !== "unitnet");
class BaseCommand extends command_1.default {
    constructor() {
        super(...arguments);
        this.tasks = [];
    }
    buildPeerOptions(flags) {
        const config = {
            networkStart: flags.networkStart,
            disableDiscovery: flags.disableDiscovery,
            skipDiscovery: flags.skipDiscovery,
            ignoreMinimumNetworkReach: flags.ignoreMinimumNetworkReach,
        };
        if (flags.launchMode === "seed") {
            config.skipDiscovery = true;
            config.ignoreMinimumNetworkReach = true;
        }
        return config;
    }
    async buildApplication(app, flags, config) {
        process.env.CORE_ENV = flags.env;
        await app.setUp(version, flags, {
            ...{ skipPlugins: flags.skipPlugins },
            ...config,
        });
        return app;
    }
    flagsToStrings(flags, ignoreKeys = []) {
        const mappedFlags = [];
        for (const [key, value] of Object.entries(flags)) {
            if (!ignoreKeys.includes(key) && value !== undefined) {
                if (value === true) {
                    mappedFlags.push(`--${key}`);
                }
                else if (typeof value === "string") {
                    mappedFlags.push(value.includes(" ") ? `--${key}="${value}"` : `--${key}=${value}`);
                }
                else {
                    mappedFlags.push(`--${key}=${value}`);
                }
            }
        }
        return mappedFlags.join(" ");
    }
    addTask(title, task) {
        this.tasks.push({ title, task });
        return this;
    }
    async runTasks() {
        try {
            const tasks = new listr_1.default(this.tasks);
            await tasks.run();
        }
        catch (error) {
            this.error(error.message);
        }
    }
    async getPaths(flags) {
        let paths = this.getEnvPaths(flags);
        for (const [key, value] of Object.entries(paths)) {
            paths[key] = `${value}/${flags.network}`;
        }
        if (process.env.CORE_PATH_CONFIG) {
            paths = { ...paths, ...{ config: path_1.resolve(process.env.CORE_PATH_CONFIG) } };
        }
        return paths;
    }
    async parseWithNetwork(command) {
        const { args, flags } = this.parse(command);
        if (!flags.token) {
            flags.token = config_1.configManager.get("token");
        }
        if (process.env.CORE_PATH_CONFIG && !flags.network) {
            let config = process.env.CORE_PATH_CONFIG;
            if (!fs_1.existsSync(config)) {
                this.error(`The given config "${config}" does not exist.`);
            }
            if (config.endsWith("/")) {
                config = config.slice(0, -1);
            }
            const network = config.split("/").pop();
            if (!this.isValidNetwork(network)) {
                this.error(`The given network "${flags.network}" is not valid.`);
            }
            flags.network = network;
        }
        if (!flags.network) {
            const { config } = this.getEnvPaths(flags);
            try {
                const folders = fs_1.readdirSync(config);
                if (!folders || folders.length === 0) {
                    this.error('We were unable to detect any configuration. Please run "ark config:publish" and try again.');
                }
                if (folders.length === 1) {
                    flags.network = folders[0];
                }
                else {
                    const response = await prompts_1.default([
                        {
                            type: "select",
                            name: "network",
                            message: "What network do you want to operate on?",
                            choices: folders
                                .filter(folder => this.isValidNetwork(folder))
                                .map(folder => ({ title: folder, value: folder })),
                        },
                        {
                            type: "confirm",
                            name: "confirm",
                            message: "Can you confirm?",
                        },
                    ]);
                    if (!response.network) {
                        this.abortWithInvalidInput();
                    }
                    if (response.confirm) {
                        flags.network = response.network;
                    }
                }
            }
            catch (error) {
                this.error('We were unable to detect any configuration. Please run "ark config:publish" and try again.');
            }
        }
        return { args, flags, paths: await this.getPaths(flags) };
    }
    abortWithInvalidInput() {
        this.error("Please enter valid data and try again!");
    }
    async buildBIP38(flags) {
        if (flags.bip39) {
            return { bip38: undefined, password: undefined };
        }
        // initial values
        let bip38 = flags.bip38 || process.env.CORE_FORGER_BIP38;
        let password = flags.password || process.env.CORE_FORGER_PASSWORD;
        if (bip38 && password) {
            return { bip38, password };
        }
        // config
        const { config } = await this.getPaths(flags);
        const configDelegates = path_1.join(config, "delegates.json");
        if (!fs_1.existsSync(configDelegates)) {
            this.error(`The ${configDelegates} file does not exist.`);
        }
        const delegates = require(configDelegates);
        if (!bip38 && delegates.bip38) {
            bip38 = delegates.bip38;
        }
        if (!bip38 && !delegates.secrets.length) {
            this.error("We were unable to detect a BIP38 or BIP39 passphrase.");
        }
        // fallback
        if (bip38 && !password) {
            const response = await prompts_1.default([
                {
                    type: "password",
                    name: "password",
                    message: "Please enter your BIP38 password",
                },
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                },
            ]);
            if (!response.password) {
                this.error("We've detected that you are using BIP38 but have not provided a valid password.");
            }
            password = response.password;
        }
        if (bip38 && password) {
            flags.bip38 = bip38;
            flags.password = password;
        }
        return { bip38, password };
    }
    getNetworks() {
        return validNetworks;
    }
    isValidNetwork(network) {
        return this.getNetworks().includes(network);
    }
    getNetworksForPrompt() {
        return this.getNetworks().map(network => ({ title: network, value: network }));
    }
    async restartRunningProcessPrompt(processName, showPrompt = true) {
        if (process_manager_1.processManager.isOnline(processName)) {
            if (showPrompt) {
                await prompts_2.confirm(`Would you like to restart the ${processName} process?`, () => {
                    this.restartProcess(processName);
                });
            }
            else {
                this.restartProcess(processName);
            }
        }
    }
    restartProcess(processName) {
        try {
            cli_ux_1.default.action.start(`Restarting ${processName}`);
            process_manager_1.processManager.restart(processName);
        }
        catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        }
        finally {
            cli_ux_1.default.action.stop();
        }
    }
    abortRunningProcess(processName) {
        if (process_manager_1.processManager.isOnline(processName)) {
            this.error(`The "${processName}" process is already running.`);
        }
    }
    abortStoppedProcess(processName) {
        if (process_manager_1.processManager.isStopped(processName)) {
            this.error(`The "${processName}" process is not running.`);
        }
    }
    abortErroredProcess(processName) {
        if (process_manager_1.processManager.isErrored(processName)) {
            this.error(`The "${processName}" process has errored.`);
        }
    }
    abortUnknownProcess(processName) {
        if (process_manager_1.processManager.isUnknown(processName)) {
            this.error(`The "${processName}" process has entered an unknown state. (${process_manager_1.processManager.status(processName)})`);
        }
    }
    abortMissingProcess(processName) {
        if (process_manager_1.processManager.missing(processName)) {
            this.error(`The "${processName}" process does not exist.`);
        }
    }
    getEnvPaths(flags) {
        return env_paths_1.default(flags.token, { suffix: "core" });
    }
}
exports.BaseCommand = BaseCommand;
BaseCommand.flagsNetwork = {
    token: command_1.flags.string({
        description: "the name of the token that should be used",
    }),
    network: command_1.flags.string({
        description: "the name of the network that should be used",
        options: validNetworks,
    }),
};
BaseCommand.flagsBehaviour = {
    networkStart: command_1.flags.boolean({
        description: "indicate that this is the first start of seeds",
    }),
    disableDiscovery: command_1.flags.boolean({
        description: "permanently disable any peer discovery",
    }),
    skipDiscovery: command_1.flags.boolean({
        description: "skip the initial peer discovery",
    }),
    ignoreMinimumNetworkReach: command_1.flags.boolean({
        description: "ignore the minimum network reach on start",
    }),
    launchMode: command_1.flags.string({
        description: "the mode the relay will be launched in (seed only at the moment)",
    }),
};
BaseCommand.flagsForger = {
    bip38: command_1.flags.string({
        description: "the encrypted bip38",
        dependsOn: ["password"],
    }),
    bip39: command_1.flags.string({
        description: "the plain text bip39 passphrase",
        exclusive: ["bip38"],
    }),
    password: command_1.flags.string({
        description: "the password for the encrypted bip38",
    }),
    suffix: command_1.flags.string({
        hidden: true,
        default: "forger",
    }),
};
BaseCommand.flagsSnapshot = {
    ...BaseCommand.flagsNetwork,
    skipCompression: command_1.flags.boolean({
        description: "skip gzip compression",
    }),
    trace: command_1.flags.boolean({
        description: "dumps generated queries and settings to console",
    }),
    suffix: command_1.flags.string({
        hidden: true,
        default: "snapshot",
    }),
};
//# sourceMappingURL=command.js.map