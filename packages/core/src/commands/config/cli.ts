import { flags } from "@oclif/command";
import { configManager } from "../../helpers/config";
import { BaseCommand } from "../command";

export class CommandLineInterfaceCommand extends BaseCommand {
    public static description: string = "Update the CLI configuration";

    public static examples: string[] = [
        `Set the token that should be used for configuration
$ yarn ark config:cli --token=mine
`,
        `Switch the npm registry channel
$ yarn ark config:cli --channel=mine
`,
    ];

    public static flags: Record<string, any> = {
        token: flags.string({
            description: "the name of the token that should be used",
        }),
        channel: flags.string({
            description: "the name of the token that should be used",
            options: ["alpha", "beta", "rc", "stable"],
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(CommandLineInterfaceCommand);

        if (flags.token) {
            configManager.update({ token: flags.token });
        }

        if (flags.channel) {
            let channel = flags.channel;

            if (channel === "stable") {
                channel = "latest";
            }

            configManager.update({ channel });
        }
    }
}
