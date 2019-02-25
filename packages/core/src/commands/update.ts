import Chalk from "chalk";
import cli from "cli-ux";
import { removeSync } from "fs-extra";
import { confirm } from "../helpers/prompts";
import { checkForUpdates, installFromChannel } from "../helpers/update";
import { processManager } from "../process-manager";
import { BaseCommand } from "./command";

export class UpdateCommand extends BaseCommand {
    public static description: string = "Update the core installation";

    public async run(): Promise<void> {
        const state = await checkForUpdates(this);

        if (!state.ready) {
            this.log(`You already have the latest version (${state.currentVersion})`);

            return;
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
                    cli.action.start(`Updating from ${currentVersion} to ${newVersion}`);

                    await installFromChannel(state.name, state.channel);

                    cli.action.stop();

                    removeSync(state.cache);

                    this.warn(`Version ${newVersion} has been installed.`);
                    this.warn(
                        'Respectively run "ark relay:restart", "ark forger:restart" or "ark core:restart" to restart your processes.',
                    );

                    const { flags } = await this.parseWithNetwork(UpdateCommand);

                    await this.restartProcess(`${flags.token}-core`);
                    await this.restartProcess(`${flags.token}-relay`);
                    await this.restartProcess(`${flags.token}-forger`);
                } catch (err) {
                    this.error(err.message);
                }
            });
        } catch (err) {
            this.error(err.message);
        }
    }

    private async restartProcess(processName: string) {
        if (processManager.exists(processName)) {
            await confirm(`Would you like to restart the ${processName} process?`, () => {
                try {
                    cli.action.start(`Restarting ${processName}`);

                    processManager.restart(processName);
                } catch (error) {
                    this.error(error.message);
                } finally {
                    cli.action.stop();
                }
            });
        }
    }
}
