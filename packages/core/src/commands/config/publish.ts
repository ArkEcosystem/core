import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import ora from "ora";
import { resolve } from "path";
import prompts from "prompts";

async function performPublishment(response) {
    const spinner = ora("Searching configuration...").start();

    // create .env file

    const coreConfigDest = resolve(expandHomeDir(response.config));
    const coreConfigSrc = resolve(__dirname, `../../src/config/${response.network}`);

    if (!fs.existsSync(coreConfigSrc)) {
        spinner.fail(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
    }

    fs.ensureDirSync(coreConfigDest);

    await delay(750);

    spinner.text = "Publishing core configuration...";
    fs.copySync(coreConfigSrc, coreConfigDest);

    await delay(750);

    spinner.succeed("Published configuration!");
}

export async function publish(options) {
    if (!options.interactive) {
        return performPublishment(options);
    }

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
            initial: options.config,
            validate: value => fs.existsSync(value),
        },
        {
            type: "confirm",
            name: "confirm",
            message: "Can you confirm?",
            initial: true,
        },
    ]);

    if (response.confirm) {
        return performPublishment(response);
    }
}
