import { flags } from "@oclif/command";
import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { BaseCommand as Command } from "../command";
import { ConfigPublish } from "./publish";

export class ConfigReset extends Command {
    public static description = "Reset the configuration";

    public static examples = [
        `Reset the configuration for the mainnet network
$ ark config:reset --network=mainnet
`,
        `Reset the configuration with custom data and config paths
$ ark config:reset --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
    ];

    public static flags = {
        data: flags.string({
            description: "the directory that contains the core data",
            default: "~/.ark",
        }),
        config: flags.string({
            description: "the directory that contains the core configuration",
            default: "~/.ark/config",
        }),
        network: flags.string({
            description: "the name of the network that should be used",
        }),
    };

    public async run() {
        const { flags } = this.parse(ConfigReset);

        if (flags.data && flags.config && flags.network) {
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

    private async performReset(flags) {
        const configDir = resolve(expandHomeDir(flags.config));

        await this.addTask("Remove configuration", async () => {
            if (!fs.existsSync(configDir)) {
                throw new Error(`Couldn't find the core configuration at ${configDir}.`);
            }

            fs.removeSync(configDir);

            await delay(500);
        })
            .addTask("Publish configuration", async () => {
                await ConfigPublish.run();

                await delay(500);
            })
            .runTasks();
    }
}
