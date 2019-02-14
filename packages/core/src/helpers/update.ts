import { Hook, IConfig } from "@oclif/config";
import Chalk from "chalk";
import { shell } from "execa";
import { statSync } from "fs";
import got from "got";
import { join } from "path";
import prompts from "prompts";
import semver from "semver";

async function getVersionFromNode(name: string, channel: string): Promise<string> {
    const { body } = await got(`https://registry.npmjs.org/${name}`);

    if (channel === "stable") {
        channel = "latest";
    }

    return JSON.parse(body)["dist-tags"][channel];
}

export function needsRefresh(config: IConfig) {
    const file = join(config.cacheDir, "version");

    try {
        const { mtime } = statSync(file);
        const staleAt = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);

        return staleAt < new Date();
    } catch (error) {
        this.error(error.message);

        return true;
    }
}

export async function checkForUpdates({ config, error, warn }, channel: string = "stable"): Promise<void> {
    try {
        const remoteVersion = await getVersionFromNode(config.name, channel);

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
                try {
                    const { stdout, stderr } = await shell(`yarn global add ${config.name}`);

                    if (stderr) {
                        console.error(stderr);
                    }

                    console.log(stdout);
                } catch (err) {
                    error(err.message);
                }
            }
        }
    } catch (err) {
        error(err.message);
    }
}
