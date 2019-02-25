import Chalk from "chalk";
import cli from "cli-ux";
import { removeSync } from "fs-extra";
import { requestConfirmation } from "../helpers/prompts";
import { checkForUpdates, installFromChannel } from "../helpers/update";
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

            await requestConfirmation("Would you like to update?", async () => {
                try {
                    cli.action.start(`Updating from ${currentVersion} to ${newVersion}`);

                    await installFromChannel(state.name, state.channel);

                    cli.action.stop();

                    removeSync(state.cache);

                    this.warn(`Version ${newVersion} has been installed.`);
                    this.warn(
                        'Respectively run "ark relay:restart", "ark forger:restart" or "ark core:restart" to restart your processes.',
                    );

                    // @TODO ask the user if he wants to restart the core
                    // @TODO ask the user if he wants to restart the relay
                    // @TODO ask the user if he wants to restart the forger

                    process.exit();
                } catch (err) {
                    this.error(err.message);
                }
            });
        } catch (err) {
            this.error(err.message);
        }
    }
}
