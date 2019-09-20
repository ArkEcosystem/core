import Command, { flags } from "@oclif/command";
import cli from "cli-ux";

import { abort } from "../../common/cli";
import { configManager } from "../../common/config-manager";
import { restartRunningProcessWithPrompt } from "../../common/process";
import { installFromChannel } from "../../common/update";
import { CommandFlags } from "../../types";

export class CommandLineInterfaceCommand extends Command {
    public static description = "Update the CLI configuration";

    public static examples: string[] = [
        `Set the token that should be used for configuration
$ ark config:cli --token=mine
`,
        `Switch the npm registry channel
$ ark config:cli --channel=next
`,
    ];

    public static flags: CommandFlags = {
        token: flags.string({
            description: "the name of the token that should be used",
        }),
        channel: flags.string({
            description: "the name of the channel that should be used",
            options: ["next", "latest"],
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(CommandLineInterfaceCommand);

        /* istanbul ignore else */
        if (flags.token) {
            configManager.set("token", flags.token as string);
        }

        if (flags.channel) {
            await this.changeChannel(flags.channel);
        }
    }

    private async changeChannel(newChannel): Promise<void> {
        const oldChannel = configManager.get("channel");

        if (oldChannel === newChannel) {
            abort(`You are already on the "${newChannel}" channel.`);
        }

        configManager.set("channel", newChannel);

        const pkg = `${this.config.name}@${newChannel}`;

        cli.action.start(`Installing ${pkg}`);

        installFromChannel(this.config.name, newChannel);

        this.warn(`${pkg} has been installed.`);

        cli.action.stop();

        const { flags } = await this.parse(CommandLineInterfaceCommand);

        await restartRunningProcessWithPrompt(`${flags.token}-core`);
        await restartRunningProcessWithPrompt(`${flags.token}-relay`);
        await restartRunningProcessWithPrompt(`${flags.token}-forger`);

        cli.action.stop();
    }
}
