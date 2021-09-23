"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const prompts_1 = __importDefault(require("prompts"));
const config_1 = require("../../helpers/config");
const command_1 = require("../command");
class PublishCommand extends command_1.BaseCommand {
    async run() {
        const { flags } = this.parse(PublishCommand);
        if (!flags.token) {
            flags.token = config_1.configManager.get("token");
        }
        if (flags.network) {
            return this.performPublishment(flags);
        }
        // Interactive CLI
        const response = await prompts_1.default([
            {
                type: "select",
                name: "network",
                message: "What network do you want to operate on?",
                choices: this.getNetworksForPrompt(),
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
            return this.performPublishment({ ...response, ...flags });
        }
    }
    async performPublishment(flags) {
        const { config } = await this.getPaths(flags);
        if (!this.isValidNetwork(flags.network)) {
            this.error(`The given network "${flags.network}" is not valid.`);
        }
        const coreConfigDest = config;
        const coreConfigSrc = path_1.resolve(__dirname, `../../../bin/config/${flags.network}`);
        this.addTask("Prepare directories", async () => {
            if (fs_extra_1.default.existsSync(coreConfigDest)) {
                this.error(`${coreConfigDest} already exists. Please run "ark config:reset" if you wish to reset your configuration.`);
            }
            if (!fs_extra_1.default.existsSync(coreConfigSrc)) {
                this.error(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
            }
            fs_extra_1.default.ensureDirSync(coreConfigDest);
        });
        this.addTask("Publish environment", async () => {
            if (!fs_extra_1.default.existsSync(`${coreConfigSrc}/.env`)) {
                this.error(`Couldn't find the environment file at ${coreConfigSrc}/.env.`);
            }
            fs_extra_1.default.copySync(`${coreConfigSrc}/.env`, `${coreConfigDest}/.env`);
        });
        this.addTask("Publish configuration", async () => {
            fs_extra_1.default.copySync(coreConfigSrc, coreConfigDest);
        });
        await this.runTasks();
    }
}
exports.PublishCommand = PublishCommand;
PublishCommand.description = "Publish the configuration";
PublishCommand.examples = [
    `Publish the configuration for the mainnet network
$ ark config:publish --network=mainnet
`,
];
PublishCommand.flags = {
    ...command_1.BaseCommand.flagsNetwork,
};
//# sourceMappingURL=publish.js.map