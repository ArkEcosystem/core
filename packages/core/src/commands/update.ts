import { flags } from "@oclif/command";
import { checkForUpdates, getUpdateChannel } from "../helpers/update";
import { BaseCommand } from "./command";

export class UpdateCommand extends BaseCommand {
    public static description: string = "Update the core installation";

    public static examples: string[] = [
        `Update the stable release
$ ark update
`,
        `Update the alpha release
$ ark update --channel=alpha
`,
        `Update the beta release
$ ark update --channel=beta
`,
        `Update the release candidate release
$ ark update --channel=rc
`,
    ];

    public static flags: Record<string, any> = {
        channel: flags.string({
            description: "the channel that should be used to check for updates",
            options: ["alpha", "beta", "rc", "stable"],
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(UpdateCommand);

        await checkForUpdates(this, getUpdateChannel(this.config));
    }
}
