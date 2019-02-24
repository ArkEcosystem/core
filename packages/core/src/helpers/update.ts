import { IConfig } from "@oclif/config";
import Chalk from "chalk";
import cli from "cli-ux";
import { shell } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { existsSync } from "fs-extra";
import { ensureDirSync, removeSync } from "fs-extra";
import latestVersion from "latest-version";
import { join } from "path";
import prompts from "prompts";
import semver from "semver";
import { configManager } from "./config";

async function getVersionFromNode(name: string, channel: string): Promise<string> {
    try {
        const version = await latestVersion(name, { version: channel });

        return version;
    } catch (error) {
        return undefined;
    }
}

function ensureCacheFile(config: IConfig): string {
    ensureDirSync(config.cacheDir);

    return join(config.cacheDir, "update");
}

export function getUpdateChannel(config: IConfig): string {
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
    if (existsSync(join(__dirname, "../../../..", ".git"))) {
        if (!process.env.CORE_DEVELOPER_MODE) {
            warn(`You are using a git clone for developers. Please install core via yarn for auto-updates.`);
        }
        return;
    }

    try {
        const channel = configManager.get("channel");
        const cacheFile = ensureCacheFile(config);

        cli.action.start(`Checking for updates`);
        const remoteVersion = await getVersionFromNode(config.name, channel);
        cli.action.stop();

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
                },
            ]);

            if (response.confirm) {
                cli.action.start(`Updating from ${config.version} to ${remoteVersion}`);

                try {
                    const { stdout, stderr } = await shell(`yarn global add ${config.name}@${channel}`);

                    if (stderr) {
                        console.error(stderr);
                    }

                    console.log(stdout);

                    removeSync(cacheFile);

                    cli.action.stop();

                    warn(`Version ${remoteVersion} has been installed. Please restart your relay and forger.`);

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
