import { Utils } from "@arkecosystem/core-kernel";
import Command, { flags } from "@oclif/command";
import Chalk from "chalk";
import cli from "cli-ux";
import { removeSync } from "fs-extra";
import prompts from "prompts";

import { abort } from "../common/cli";
import { flagsNetwork } from "../common/flags";
import { restartRunningProcess, restartRunningProcessWithPrompt } from "../common/process";
import { checkForUpdates, installFromChannel } from "../common/update";
import { CommandFlags } from "../types";

export class UpdateCommand extends Command {
    public static description = "Update the core installation";

    public static flags: CommandFlags = {
        ...flagsNetwork,
        force: flags.boolean({
            description: "force an update",
        }),
        restart: flags.boolean({
            description: "restart all running processes",
            exclusive: ["restartCore", "restartRelay", "restartForger"],
            allowNo: true,
        }),
        restartCore: flags.boolean({
            description: "restart the core process",
        }),
        restartRelay: flags.boolean({
            description: "restart the relay process",
        }),
        restartForger: flags.boolean({
            description: "restart the forger process",
        }),
    };

    public async run(): Promise<void> {
        const state = await checkForUpdates(this);

        if (!state.ready) {
            abort(`You already have the latest version (${state.currentVersion})`);
        }

        const { flags } = this.parse(UpdateCommand);

        if (flags.force) {
            return this.performUpdate(flags, state);
        }

        this.warn(
            `${state.name} update available from ${Chalk.greenBright(state.currentVersion)} to ${Chalk.greenBright(
                state.updateVersion,
            )}.`,
        );

        const { confirm } = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: "Would you like to update?",
            },
        ]);

        if (!confirm) {
            abort("You'll need to confirm the update to continue.");
        }

        await this.performUpdate(flags, state);
    }

    private async performUpdate(flags: CommandFlags, state: Record<string, any>): Promise<void> {
        cli.action.start(`Updating from ${state.currentVersion} to ${state.updateVersion}`);

        installFromChannel(state.name, state.updateVersion);

        cli.action.stop();

        removeSync(state.cache);

        this.warn(`Version ${state.updateVersion} has been installed.`);

        if (this.hasRestartFlag(flags)) {
            if (flags.restart) {
                await restartRunningProcess(`${flags.token}-core`);
                await restartRunningProcess(`${flags.token}-relay`);
                await restartRunningProcess(`${flags.token}-forger`);
            } else {
                if (flags.restartCore) {
                    await restartRunningProcess(`${flags.token}-core`);
                }

                if (flags.restartRelay) {
                    await restartRunningProcess(`${flags.token}-relay`);
                }

                if (flags.restartForger) {
                    await restartRunningProcess(`${flags.token}-forger`);
                }
            }
        } else {
            await restartRunningProcessWithPrompt(`${flags.token}-core`);
            await restartRunningProcessWithPrompt(`${flags.token}-relay`);
            await restartRunningProcessWithPrompt(`${flags.token}-forger`);
        }
    }

    private hasRestartFlag(flags: CommandFlags): boolean {
        return Utils.hasSomeProperty(flags, ["restart", "restartCore", "restartRelay", "restartForger"]);
    }
}
