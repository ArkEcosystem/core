import { flags } from "@oclif/command";
import cli from "cli-ux";

import { confirm } from "../helpers/prompts";
import { installFromChannel } from "../helpers/update";
import { CommandFlags } from "../types";
import { BaseCommand } from "./command";

export class ReinstallCommand extends BaseCommand {
    public static description = "Reinstall the core";

    public static flags: CommandFlags = {
        force: flags.boolean({
            description: "force a reinstall",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(ReinstallCommand);

        if (flags.force) {
            return this.performInstall(flags);
        }

        try {
            await confirm("Are you sure you want to reinstall?", async () => {
                try {
                    await this.performInstall(flags);
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

    private async performInstall(flags: CommandFlags): Promise<void> {
        cli.action.start(`Reinstalling ${this.config.version}`);

        await installFromChannel(this.config.name, this.config.version);

        cli.action.stop();

        this.warn(`Version ${this.config.version} has been installed.`);

        await this.restartRunningProcessPrompt(`${flags.token}-core`);
        await this.restartRunningProcessPrompt(`${flags.token}-relay`);
        await this.restartRunningProcessPrompt(`${flags.token}-forger`);
    }
}
