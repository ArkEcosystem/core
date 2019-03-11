// Based on https://github.com/oclif/plugin-not-found/blob/master/src/index.ts

import { Hook } from "@oclif/config";
import Chalk from "chalk";
import cli from "cli-ux";
import * as Levenshtein from "fast-levenshtein";
import minBy from "lodash/minBy";
import { confirm } from "../../helpers/prompts";

function closest(commandIDs: string[], cmd: string) {
    return minBy(commandIDs, c => Levenshtein.get(cmd, c))!;
}

export const init: Hook<"init"> = async function(opts) {
    const commandIDs = opts.config.commandIDs;

    if (!commandIDs.length) {
        return;
    }

    let binHelp = `${opts.config.bin} help`;
    const idSplit = opts.id.split(":");
    if (await opts.config.findTopic(idSplit[0])) {
        // if valid topic, update binHelp with topic
        binHelp = `${binHelp} ${idSplit[0]}`;
    }

    const suggestion: string = closest(commandIDs, opts.id);
    this.warn(`${Chalk.redBright(opts.id)} is not a ${opts.config.bin} command.`);

    await confirm(`Did you mean ${Chalk.blueBright(suggestion)}?`, async () => {
        try {
            const argv = process.argv;
            await this.config.runCommand(suggestion, argv.slice(3, argv.length));
        } catch (err) {
            this.error(err.message);
            this.error(`Run ${Chalk.blueBright(binHelp)} for a list of available commands.`, { exit: 127 });
        } finally {
            cli.action.stop();
        }
    });
};
