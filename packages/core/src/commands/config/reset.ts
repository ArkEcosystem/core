import { flags } from "@oclif/command";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { BaseCommand } from "../command";
import { PublishCommand } from "./publish";

export class ResetCommand extends BaseCommand {
    public static description: string = "Reset the configuration";

    public static examples: string[] = [
        `Reset the configuration for the mainnet network
$ ark config:reset --network=mainnet
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        force: flags.boolean({
            description: "force the configuration to be reset",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ResetCommand);

        if (flags.token && flags.network && flags.force) {
            return this.performReset(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: "Are you absolutely sure that you want to reset the configuration?",
                initial: true,
            },
        ]);

        if (response.confirm) {
            return this.performReset(flags);
        }
    }

    private async performReset(flags: Record<string, any>): Promise<void> {
        const { config } = await this.getPaths(flags);

        this.addTask("Remove configuration", async () => {
            fs.removeSync(config);
        });

        await this.runTasks();

        await PublishCommand.run(
            this.flagsToStrings(flags)
                .split(" ")
                .concat(["--force"]),
        );
    }
}
