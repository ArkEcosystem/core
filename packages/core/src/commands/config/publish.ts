import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { configManager } from "../../helpers/config";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class PublishCommand extends BaseCommand {
    public static description: string = "Publish the configuration";

    public static examples: string[] = [
        `Publish the configuration for the mainnet network
$ ark config:publish --network=mainnet
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(PublishCommand);

        if (!flags.token) {
            flags.token = configManager.get("token");
        }

        if (flags.network) {
            return this.performPublishment(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "select",
                name: "network",
                message: "What network do you want to operate on?",
                choices: this.getNetworksForPrompt(),
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.network) {
            this.abortWithInvalidInput();
        }

        if (response.confirm) {
            return this.performPublishment({ ...response, ...flags });
        }
    }

    private async performPublishment(flags: CommandFlags): Promise<void> {
        const { config } = await this.getPaths(flags);

        if (!this.isValidNetwork(flags.network)) {
            this.error(`The given network "${flags.network}" is not valid.`);
        }

        const coreConfigDest = config;
        const coreConfigSrc = resolve(__dirname, `../../../bin/config/${flags.network}`);

        this.addTask("Prepare directories", async () => {
            if (fs.existsSync(coreConfigDest)) {
                this.error(
                    `${coreConfigDest} already exists. Please run "ark config:reset" if you wish to reset your configuration.`,
                );
            }

            if (!fs.existsSync(coreConfigSrc)) {
                this.error(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
            }

            fs.ensureDirSync(coreConfigDest);
        });

        this.addTask("Publish environment", async () => {
            if (!fs.existsSync(`${coreConfigSrc}/.env`)) {
                this.error(`Couldn't find the environment file at ${coreConfigSrc}/.env.`);
            }

            fs.copySync(`${coreConfigSrc}/.env`, `${coreConfigDest}/.env`);
        });

        this.addTask("Publish configuration", async () => {
            fs.copySync(coreConfigSrc, coreConfigDest);
        });

        await this.runTasks();
    }
}
