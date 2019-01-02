import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import Command from "../command";
import { ConfigPublish } from "./publish";

export class ConfigReset extends Command {
    public static description = "Reset the configuration";

    public static examples = [`$ ark config:reset`];

    public static flags = {
        ...Command.flagsNetwork,
    };

    public async run() {
        const { flags } = this.parse(ConfigReset);

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
