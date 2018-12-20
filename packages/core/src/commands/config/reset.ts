import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import ora from "ora";
import { resolve } from "path";
import prompts from "prompts";
import { ConfigPublish } from "./publish";

import { AbstractCommand } from "../command";

export class ConfigReset extends AbstractCommand {
    public async handle() {
        if (this.isInterface()) {
            return this.performReset();
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
            return this.performReset();
        }
    }

    private async performReset() {
        const spinner = ora("Removing configuration...").start();

        fs.removeSync(resolve(expandHomeDir(this.options.config)));

        await delay(750);

        spinner.succeed("Removed configuration!");

        await new ConfigPublish(this.options).handle();
    }
}
