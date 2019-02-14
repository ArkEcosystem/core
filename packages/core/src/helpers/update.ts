import { IConfig } from "@oclif/config";
import Chalk from "chalk";
import cli from "cli-ux";
import { shell } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { ensureDirSync, removeSync } from "fs-extra";
import got from "got";
import { join } from "path";
import prompts from "prompts";
import semver from "semver";

async function getVersionFromNode(name: string, channel: string): Promise<string> {
    const { body } = await got(`https://registry.npmjs.org/${name}`);

    return JSON.parse(body)["dist-tags"][channel];
}

function ensureCacheFile(config: IConfig): string {
    ensureDirSync(config.cacheDir);

    return join(config.cacheDir, "update");
}

function getUpdateChannel(config: IConfig): string {
    const channels: string[] = ["alpha", "beta", "rc"];

    let channel: string = "latest";
    for (const item of channels) {
        if (config.version.includes(`-${item}`)) {
            channel = item;
        }
    }

    return channel;
}

export function needsRefresh(config: IConfig): boolean {
    const cacheFile = ensureCacheFile(config);

    try {
        const { mtime } = statSync(cacheFile);
        const staleAt = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);

        return staleAt < new Date();
    } catch (err) {
        return true;
    }
}

export async function checkForUpdates({ config, error, log, warn }): Promise<void> {
    try {
        const channel = getUpdateChannel(config);
        const cacheFile = ensureCacheFile(config);
        const remoteVersion = await getVersionFromNode(config.name, channel);

        closeSync(openSync(cacheFile, "w"));

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

                    removeSync(cacheFile);

                    cli.action.stop();

                    this.warn(`Version ${remoteVersion} has been installed. Please restart your relay and forger.`);

                    process.exit();
                } catch (err) {
                    error(err.message);
                }
            }
        } else {
            log(`You already have the latest version (${config.version})`);
        }
    } catch (err) {
        error(err.message);
    }
}
