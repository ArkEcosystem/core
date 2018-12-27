import { flags } from "@oclif/command";
import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import ora from "ora";
import { resolve } from "path";
import prompts from "prompts";
import Command from "../command";
import { ConfigPublish } from "./publish";

export class ConfigReset extends Command {
    public static description = "Reset the configuration";

    public static examples = [`$ ark config:get`];

    public static flags = { config: flags.string({ char: "n", description: "..." }) };

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
        const spinner = ora("Removing configuration...").start();

        fs.removeSync(resolve(expandHomeDir(flags.config)));

        await delay(750);

        spinner.succeed("Removed configuration!");

        await ConfigPublish.run();
    }
}
