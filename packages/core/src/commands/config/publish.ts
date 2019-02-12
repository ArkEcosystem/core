import { flags } from "@oclif/command";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { BaseCommand } from "../command";

export class PublishCommand extends BaseCommand {
    public static description: string = "Publish the configuration";

    public static examples: string[] = [
        `Publish the configuration for the mainnet network
$ ark config:publish --network=mainnet
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetworkRequired,
        force: flags.boolean({
            char: "f",
            description: "force the configuration to be overwritten",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(PublishCommand);

        if (flags.token && flags.network && flags.force) {
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
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
                initial: true,
            },
        ]);

        if (!response.network) {
            this.abortWithInvalidInput();
        }

        if (response.confirm) {
            return this.performPublishment(response);
        }
    }

    private async performPublishment(flags: Record<string, any>): Promise<void> {
        const corePaths = await this.getPaths(flags);

        const coreConfigDest = corePaths.config;
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

            fs.copySync(`${coreConfigSrc}/.env`, `${coreConfigDest}/.env`);
        });

        this.addTask("Publish configuration", async () => {
            fs.copySync(coreConfigSrc, coreConfigDest);
        });

        await this.runTasks();
    }
}
