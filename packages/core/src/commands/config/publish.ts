import { flags } from "@oclif/command";
import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { BaseCommand as Command } from "../command";

export class ConfigPublish extends Command {
    public static description = "Publish the configuration";

    public static examples = [
        `Publish the configuration for the mainnet network
$ ark config:publish --network=mainnet
`,
        `Publish the configuration with custom data and config paths
$ ark config:publish --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
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
        const { flags } = this.parse(ConfigPublish);

        if (flags.data && flags.config && flags.network) {
            return this.performPublishment(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "autocomplete",
                name: "network",
                message: "What network do you want to operate on?",
                choices: [
                    { title: "Production", value: "mainnet" },
                    { title: "Development", value: "devnet" },
                    { title: "Test", value: "testnet" },
                ],
            },
            {
                type: "text",
                name: "data",
                message: "Where do you want the data to be located?",
                initial: flags.data,
            },
            {
                type: "text",
                name: "config",
                message: "Where do you want the configuration to be located?",
                initial: flags.config,
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
                initial: true,
            },
        ]);

        if (response.confirm) {
            return this.performPublishment(response);
        }
    }

    private async performPublishment(response) {
        const coreConfigDest = resolve(expandHomeDir(response.config));
        const coreConfigSrc = resolve(__dirname, `../../config/${response.network}`);

        await this.addTask("Prepare directories", async () => {
            if (!fs.existsSync(coreConfigSrc)) {
                throw new Error(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
            }

            fs.ensureDirSync(coreConfigDest);

            await delay(500);
        })
            .addTask("Publish environment", async () => {
                //

                await delay(500);
            })
            .addTask("Publish configuration", async () => {
                fs.copySync(coreConfigSrc, coreConfigDest);

                await delay(500);
            })
            .runTasks();
    }
}
