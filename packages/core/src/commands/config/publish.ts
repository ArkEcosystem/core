import { flags } from "@oclif/command";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { BaseCommand } from "../command";

export class ConfigPublish extends BaseCommand {
    public static description: string = "Publish the configuration";

    public static examples: string[] = [
        `Publish the configuration for the mainnet network
$ ark config:publish --network=mainnet
`,
        `Publish the configuration with custom data and config paths
$ ark config:publish --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
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
            description: "force the configuration to be overwritten",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(ConfigPublish);

        if (flags.data && flags.config && flags.network && flags.force) {
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

    private async performPublishment(flags: Record<string, any>): Promise<void> {
        const coreConfigDest = resolve(expandHomeDir(flags.config));
        const coreConfigSrc = resolve(__dirname, `../../../bin/config/${flags.network}`);

        this.addTask("Prepare directories", async () => {
            if (!fs.existsSync(coreConfigSrc)) {
                throw new Error(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
            }

            fs.ensureDirSync(coreConfigDest);
        });

        this.addTask("Publish environment", async () => {
            if (!fs.existsSync(`${coreConfigSrc}/.env`)) {
                throw new Error(`Couldn't find the environment file at ${coreConfigSrc}/.env.`);
            }

            const coreDataDest = resolve(expandHomeDir(flags.data));

            fs.copySync(`${coreConfigSrc}/.env`, `${coreDataDest}/.env`);
        });

        this.addTask("Publish configuration", async () => {
            fs.copySync(coreConfigSrc, coreConfigDest);
        });

        await this.runTasks();
    }
}
