import { flags } from "@oclif/command";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { BaseCommand } from "../command";
import { ConfigPublish } from "./publish";

export class ConfigReset extends BaseCommand {
    public static description: string = "Reset the configuration";

    public static examples: string[] = [
        `Reset the configuration for the mainnet network
$ ark config:reset --network=mainnet
`,
        `Reset the configuration with custom data and config paths
$ ark config:reset --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsConfig,
        network: flags.string({
            description: "the name of the network that should be used",
            options: ["mainnet", "devnet", "testnet"],
        }),
        force: flags.boolean({
            char: "f",
            description: "force the configuration to be reset",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ConfigReset);

        if (flags.data && flags.config && flags.network && flags.force) {
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
        const configDir = resolve(expandHomeDir(flags.config));

        this.addTask("Remove configuration", async () => {
            fs.removeSync(configDir);
        });

        await this.runTasks();

        await ConfigPublish.run(this.flagsToStrings(flags).split(" "));
    }
}
