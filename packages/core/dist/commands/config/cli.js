"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const cli_ux_1 = __importDefault(require("cli-ux"));
const config_1 = require("../../helpers/config");
const update_1 = require("../../helpers/update");
const command_2 = require("../command");
class CommandLineInterfaceCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(CommandLineInterfaceCommand);
        if (flags.token) {
            config_1.configManager.set("token", flags.token);
        }
        if (flags.channel) {
            this.changeChannel(flags.channel);
        }
    }
    async changeChannel(newChannel) {
        const oldChannel = config_1.configManager.get("channel");
        if (oldChannel === newChannel) {
            this.warn(`You are already on the "${newChannel}" channel.`);
            return;
        }
        config_1.configManager.set("channel", newChannel);
        const pkg = `${this.config.name}@${newChannel}`;
        try {
            cli_ux_1.default.action.start(`Installing ${pkg}`);
            await update_1.installFromChannel(this.config.name, newChannel);
            this.warn(`${pkg} has been installed.`);
            cli_ux_1.default.action.stop();
            const { flags } = await this.parseWithNetwork(CommandLineInterfaceCommand);
            await this.restartRunningProcessPrompt(`${flags.token}-core`);
            await this.restartRunningProcessPrompt(`${flags.token}-relay`);
            await this.restartRunningProcessPrompt(`${flags.token}-forger`);
        }
        catch (err) {
            this.error(err.message);
        }
        finally {
            cli_ux_1.default.action.stop();
        }
    }
}
exports.CommandLineInterfaceCommand = CommandLineInterfaceCommand;
CommandLineInterfaceCommand.description = "Update the CLI configuration";
CommandLineInterfaceCommand.examples = [
    `Set the token that should be used for configuration
$ ark config:cli --token=mine
`,
    `Switch the npm registry channel
$ ark config:cli --channel=next
`,
];
CommandLineInterfaceCommand.flags = {
    token: command_1.flags.string({
        description: "the name of the token that should be used",
    }),
    channel: command_1.flags.string({
        description: "the name of the channel that should be used",
        options: ["next", "latest"],
    }),
};
//# sourceMappingURL=cli.js.map