"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const command_1 = require("@oclif/command");
const chalk_1 = __importDefault(require("chalk"));
const cli_ux_1 = __importDefault(require("cli-ux"));
const fs_extra_1 = require("fs-extra");
const prompts_1 = require("../helpers/prompts");
const update_1 = require("../helpers/update");
const command_2 = require("./command");
class UpdateCommand extends command_2.BaseCommand {
    async run() {
        const state = await update_1.checkForUpdates(this);
        if (!state.ready) {
            this.log(`You already have the latest version (${state.currentVersion})`);
            return;
        }
        const { flags } = await this.parseWithNetwork(UpdateCommand);
        if (flags.force) {
            return this.performUpdate(flags, state);
        }
        try {
            this.warn(`${state.name} update available from ${chalk_1.default.greenBright(state.currentVersion)} to ${chalk_1.default.greenBright(state.updateVersion)}.`);
            await prompts_1.confirm("Would you like to update?", async () => {
                try {
                    await this.performUpdate(flags, state);
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
    async performUpdate(flags, state) {
        cli_ux_1.default.action.start(`Updating from ${state.currentVersion} to ${state.updateVersion}`);
        await update_1.installFromChannel(state.name, state.updateVersion);
        cli_ux_1.default.action.stop();
        fs_extra_1.removeSync(state.cache);
        this.warn(`Version ${state.updateVersion} has been installed.`);
        if (this.hasRestartFlag(flags)) {
            if (flags.restart) {
                this.restartRunningProcessPrompt(`${flags.token}-core`, false);
                this.restartRunningProcessPrompt(`${flags.token}-relay`, false);
                this.restartRunningProcessPrompt(`${flags.token}-forger`, false);
            }
            else {
                if (flags.restartCore) {
                    this.restartRunningProcessPrompt(`${flags.token}-core`, false);
                }
                if (flags.restartRelay) {
                    this.restartRunningProcessPrompt(`${flags.token}-relay`, false);
                }
                if (flags.restartForger) {
                    this.restartRunningProcessPrompt(`${flags.token}-forger`, false);
                }
            }
        }
        else {
            await this.restartRunningProcessPrompt(`${flags.token}-core`);
            await this.restartRunningProcessPrompt(`${flags.token}-relay`);
            await this.restartRunningProcessPrompt(`${flags.token}-forger`);
        }
    }
    hasRestartFlag(flags) {
        return core_utils_1.hasSomeProperty(flags, ["restart", "restartCore", "restartRelay", "restartForger"]);
    }
}
exports.UpdateCommand = UpdateCommand;
UpdateCommand.description = "Update the core installation";
UpdateCommand.flags = {
    force: command_1.flags.boolean({
        description: "force an update",
    }),
    restart: command_1.flags.boolean({
        description: "restart all running processes",
        exclusive: ["restartCore", "restartRelay", "restartForger"],
        allowNo: true,
    }),
    restartCore: command_1.flags.boolean({
        description: "restart the core process",
    }),
    restartRelay: command_1.flags.boolean({
        description: "restart the relay process",
    }),
    restartForger: command_1.flags.boolean({
        description: "restart the forger process",
    }),
};
//# sourceMappingURL=update.js.map