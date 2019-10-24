// Based on https://github.com/oclif/plugin-not-found/blob/master/src/index.ts

import { Utils } from "@arkecosystem/core-kernel";
import { Hook } from "@oclif/config";
import Chalk from "chalk";
import Levenshtein from "fast-levenshtein";
import prompts from "prompts";

import { abort } from "../../common/cli";

const closest = (commandIDs: string[], cmd: string) => {
    return Utils.minBy(commandIDs, c => Levenshtein.get(cmd, c))!;
};

export const init: Hook<"init"> = async function({ id, config }) {
    const commandIDs: string[] = config.commandIDs;

    if (!commandIDs || !commandIDs.length || !id) {
        return;
    }

    let binHelp = `${config.bin} help`;
    const idSplit = id.split(":");
    if (config.findTopic(idSplit[0])) {
        // if valid topic, update binHelp with topic
        binHelp = `${binHelp} ${idSplit[0]}`;
    }

    const suggestion: string = closest(commandIDs, id);
    this.warn(`${Chalk.redBright(id)} is not a ${config.bin} command.`);

    const { confirm } = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message: `Did you mean ${Chalk.blueBright(suggestion)}?`,
        },
    ]);

    if (!confirm) {
        abort(`Run ${Chalk.blueBright(binHelp)} for a list of available commands.`);
    }

    const argv: string[] = process.argv;

    await config.runCommand(suggestion, argv.slice(3, argv.length));
};
