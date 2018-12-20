import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import ora from "ora";
import { resolve } from "path";
import prompts from "prompts";
import { publish } from "./publish";

async function performReset(options) {
    const spinner = ora("Removing configuration...").start();

    fs.removeSync(resolve(expandHomeDir(options.config)));

    await delay(750);

    spinner.succeed("Removed configuration!");

    await publish(options);
}

export async function reset(options) {
    if (!options.interactive) {
        return performReset(options);
    }

    const response = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message: "Are you absolutely sure that you want to reset the configuration?",
            initial: true,
        },
    ]);

    if (response.confirm) {
        return performReset(options);
    }
}
