import { flags } from "@oclif/command";
import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import ora from "ora";
import { resolve } from "path";
import prompts from "prompts";
import Command from "../command";

export class ConfigPublish extends Command {
    public static description = "Publish the configuration";

    public static examples = [`$ ark config:get`];

    public static flags = { config: flags.string({ char: "n", description: "..." }) };

    public async run() {
        const { flags } = this.parse(ConfigPublish);

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
        const spinner = ora("Searching configuration...").start();

        // create .env file

        const coreConfigDest = resolve(expandHomeDir(response.config));
        const coreConfigSrc = resolve(__dirname, `../../config/${response.network}`);

        if (!fs.existsSync(coreConfigSrc)) {
            return spinner.fail(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
        }

        fs.ensureDirSync(coreConfigDest);

        await delay(750);

        spinner.text = "Publishing core configuration...";
        fs.copySync(coreConfigSrc, coreConfigDest);

        await delay(750);

        spinner.succeed("Published configuration!");
    }
}
