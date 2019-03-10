import { flags } from "@oclif/command";
import Chalk from "chalk";
import cli from "cli-ux";
import { removeSync } from "fs-extra";
import { confirm } from "../helpers/prompts";
import { checkForUpdates, installFromChannel } from "../helpers/update";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";
import { hasSomeProperty } from "@arkecosystem/core-utils";

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
            const currentVersion = state.currentVersion;
            const newVersion = state.updateVersion;

            this.warn(
                `${state.name} update available from ${Chalk.greenBright(currentVersion)} to ${Chalk.greenBright(
                    newVersion,
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
        cli.action.start(`Updating from ${state.currentVersion} to ${state.newVersion}`);

        await installFromChannel(state.name, state.newVersion);

        cli.action.stop();

        removeSync(state.cache);

        this.warn(`Version ${state.newVersion} has been installed.`);

        if (this.hasRestartFlag(flags)) {
            if (flags.restart) {
                this.restartProcess(`${flags.token}-core`, false);
                this.restartProcess(`${flags.token}-relay`, false);
                this.restartProcess(`${flags.token}-forger`, false);
            } else {
                if (flags.restartCore) {
                    this.restartProcess(`${flags.token}-core`, false);
                }

                if (flags.restartRelay) {
                    this.restartProcess(`${flags.token}-relay`, false);
                }

                if (flags.restartForger) {
                    this.restartProcess(`${flags.token}-forger`, false);
                }
            }
        } else {
            await this.restartProcess(`${flags.token}-core`);
            await this.restartProcess(`${flags.token}-relay`);
            await this.restartProcess(`${flags.token}-forger`);
        }
    }

    private hasRestartFlag(flags: CommandFlags): boolean {
        return hasSomeProperty(flags, ["restart", "restartCore", "restartRelay", "restartForger"]);
    }
}
