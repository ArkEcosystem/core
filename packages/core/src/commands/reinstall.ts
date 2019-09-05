import Command, { flags } from "@oclif/command";
import cli from "cli-ux";
import prompts from "prompts";

import { restartRunningProcessWithPrompt } from "../common/process";
import { installFromChannel } from "../common/update";
import { CommandFlags } from "../types";

export class ReinstallCommand extends Command {
    public static description = "Reinstall the core";

    public static flags: CommandFlags = {
        force: flags.boolean({
            description: "force a reinstall",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(ReinstallCommand);

        if (flags.force) {
            return this.performInstall(flags);
        }

        const response = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: "Are you sure you want to reinstall?",
            },
        ]);

        if (response.confirm) {
            await this.performInstall(flags);
        }
    }

    private async performInstall(flags: CommandFlags): Promise<void> {
        cli.action.start(`Reinstalling ${this.config.version}`);

        installFromChannel(this.config.name, this.config.version);

        cli.action.stop();

        this.warn(`Version ${this.config.version} has been installed.`);

        await restartRunningProcessWithPrompt(`${flags.token}-core`);
        await restartRunningProcessWithPrompt(`${flags.token}-relay`);
        await restartRunningProcessWithPrompt(`${flags.token}-forger`);
    }
}
