import { hasSomeProperty } from "@arkecosystem/core-utils";
import { flags } from "@oclif/command";
import Chalk from "chalk";
import cli from "cli-ux";
import { removeSync } from "fs-extra";
import { confirm } from "../helpers/prompts";
import { checkForUpdates, installFromChannel } from "../helpers/update";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class UpdateCommand extends BaseCommand {
    public static description: string = "Update the core installation";

    public static flags: CommandFlags = {
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
            this.log(`You already have the latest version (${state.currentVersion})`);

            return;
        }

        const { flags } = await this.parseWithNetwork(UpdateCommand);

        if (flags.force) {
            return this.performUpdate(flags, state);
        }

        try {
            this.warn(
                `${state.name} update available from ${Chalk.greenBright(state.currentVersion)} to ${Chalk.greenBright(
                    state.updateVersion,
                )}.`,
            );

            await confirm("Would you like to update?", async () => {
                try {
                    await this.performUpdate(flags, state);
                } catch (err) {
                    this.error(err.message);
                } finally {
                    cli.action.stop();
                }
            });
        } catch (err) {
            this.error(err.message);
        }
    }

    private async performUpdate(flags: CommandFlags, state: Record<string, any>): Promise<void> {
        cli.action.start(`Updating from ${state.currentVersion} to ${state.updateVersion}`);

        await installFromChannel(state.name, state.updateVersion);

        cli.action.stop();

        removeSync(state.cache);

        this.warn(`Version ${state.updateVersion} has been installed.`);

        if (this.hasRestartFlag(flags)) {
            if (flags.restart) {
                this.restartRunningProcessPrompt(`${flags.token}-core`, false);
                this.restartRunningProcessPrompt(`${flags.token}-relay`, false);
                this.restartRunningProcessPrompt(`${flags.token}-forger`, false);
            } else {
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
        } else {
            await this.restartRunningProcessPrompt(`${flags.token}-core`);
            await this.restartRunningProcessPrompt(`${flags.token}-relay`);
            await this.restartRunningProcessPrompt(`${flags.token}-forger`);
        }
    }

    private hasRestartFlag(flags: CommandFlags): boolean {
        return hasSomeProperty(flags, ["restart", "restartCore", "restartRelay", "restartForger"]);
    }
}
