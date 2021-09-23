"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const cli_ux_1 = __importDefault(require("cli-ux"));
const prompts_1 = require("../helpers/prompts");
const update_1 = require("../helpers/update");
const command_2 = require("./command");
class ReinstallCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = await this.parseWithNetwork(ReinstallCommand);
        if (flags.force) {
            return this.performInstall(flags);
        }
        try {
            await prompts_1.confirm("Are you sure you want to reinstall?", async () => {
                try {
                    await this.performInstall(flags);
                }
                catch (err) {
                    this.error(err.message);
                }
                finally {
                    cli_ux_1.default.action.stop();
                }
            });
        }
        catch (err) {
            this.error(err.message);
        }
    }
    async performInstall(flags) {
        cli_ux_1.default.action.start(`Reinstalling ${this.config.version}`);
        await update_1.installFromChannel(this.config.name, this.config.version);
        cli_ux_1.default.action.stop();
        this.warn(`Version ${this.config.version} has been installed.`);
        await this.restartRunningProcessPrompt(`${flags.token}-core`);
        await this.restartRunningProcessPrompt(`${flags.token}-relay`);
        await this.restartRunningProcessPrompt(`${flags.token}-forger`);
    }
}
exports.ReinstallCommand = ReinstallCommand;
ReinstallCommand.description = "Reinstall the core";
ReinstallCommand.flags = {
    force: command_1.flags.boolean({
        description: "force a reinstall",
    }),
};
//# sourceMappingURL=reinstall.js.map