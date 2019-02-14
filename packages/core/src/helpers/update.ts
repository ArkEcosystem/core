import { IConfig } from "@oclif/config";
import Chalk from "chalk";
import cli from "cli-ux";
import { shell } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { removeSync } from "fs-extra";
import got from "got";
import { join } from "path";
import prompts from "prompts";
import semver from "semver";

async function getVersionFromNode(name: string, channel: string): Promise<string> {
    const { body } = await got(`https://registry.npmjs.org/${name}`);

    return JSON.parse(body)["dist-tags"][channel];
}

export function needsRefresh(config: IConfig) {
    const file = join(config.cacheDir, "update");

    try {
        const { mtime } = statSync(file);
        const staleAt = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);

        return staleAt < new Date();
    } catch (err) {
        return true;
    }
}

export async function checkForUpdates({ config, error, warn }, channel: string = "stable"): Promise<void> {
    if (channel === "stable") {
        channel = "latest";
    }

    try {
        const remoteVersion = await getVersionFromNode(config.name, channel);

        closeSync(openSync(join(config.cacheDir, "update"), "w"));

        if (remoteVersion === undefined) {
            error(`We were unable to find any releases for the "${channel}" channel.`);
        }

        if (semver.gt(remoteVersion, config.version)) {
            warn(
                `${config.name} update available from ${Chalk.greenBright(config.version)} to ${Chalk.greenBright(
                    remoteVersion,
                )}.`,
            );

            const response = await prompts([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Would you like to update?`,
                    initial: true,
                },
            ]);

            if (response.confirm) {
                cli.action.start(`Update from ${config.version} to ${remoteVersion} in progress. Please wait`);

                try {
                    const { stdout, stderr } = await shell(`yarn global add ${config.name}@${channel}`);

                    if (stderr) {
                        console.error(stderr);
                    }

                    console.log(stdout);

                    removeSync(join(config.cacheDir, "update"));

                    cli.action.stop();
                } catch (err) {
                    error(err.message);
                }
            }
        }
    } catch (err) {
        error(err.message);
    }
}
