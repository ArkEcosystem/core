import { Networks } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import Command from "@oclif/command";
import { copySync, ensureDirSync, existsSync, removeSync } from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";

import { abort } from "../../common/cli";
import { getPaths } from "../../common/env";
import { flagsNetwork } from "../../common/flags";
import { TaskService } from "../../common/task.service";
import { CommandFlags } from "../../types";

export class PublishCommand extends Command {
    public static description = "Publish the configuration";

    public static examples: string[] = [
        `Publish the configuration for the mainnet network
$ ark config:publish --network=mainnet
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        reset: flags.boolean({
            description: "indicate that this is the first start of seeds",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(PublishCommand);

        if (flags.network) {
            return this.performPublishment(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "select",
                name: "network",
                message: "What network do you want to operate on?",
                /* istanbul ignore next */
                choices: Object.keys(Networks).map(network => ({ title: network, value: network })),
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.network) {
            abort("You'll need to select the network to continue.");
        }

        if (!response.confirm) {
            abort("You'll need to confirm the network to continue.");
        }

        await this.performPublishment({ ...response, ...flags });
    }

    private async performPublishment(flags: CommandFlags): Promise<void> {
        const configDest = getPaths(flags.token, flags.network).config;
        const configSrc = resolve(__dirname, `../../../bin/config/${flags.network}`);

        const tasks: TaskService = new TaskService();

        if (flags.reset) {
            tasks.add("Remove configuration", () => removeSync(configDest));
        }

        tasks.add("Prepare directories", () => {
            if (existsSync(configDest)) {
                throw new Error(
                    `${configDest} already exists. Please use the --reset flag if you wish to reset your configuration.`,
                );
            }

            if (!existsSync(configSrc)) {
                throw new Error(`Couldn't find the core configuration files at ${configSrc}.`);
            }

            ensureDirSync(configDest);
        });

        tasks.add("Publish environment", () => {
            if (!existsSync(`${configSrc}/.env`)) {
                throw new Error(`Couldn't find the environment file at ${configSrc}/.env.`);
            }

            copySync(`${configSrc}/.env`, `${configDest}/.env`);
        });

        tasks.add("Publish configuration", () => copySync(configSrc, configDest));

        await tasks.run();
    }
}
