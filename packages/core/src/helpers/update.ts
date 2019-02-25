import { IConfig } from "@oclif/config";
import cli from "cli-ux";
import { shell } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { existsSync } from "fs-extra";
import { ensureDirSync } from "fs-extra";
import latestVersion from "latest-version";
import { join } from "path";
import semver from "semver";
import { configManager } from "./config";

async function getLatestVersion(name: string, channel: string): Promise<string> {
    try {
        const version = await latestVersion(name, { version: channel });

        return version;
    } catch (error) {
        return undefined;
    }
}

function ensureCacheFile(config: IConfig): string {
    ensureDirSync(config.cacheDir);

    const fileName = join(config.cacheDir, "update");

    closeSync(openSync(fileName, "w"));

    return fileName;
}

export async function installFromChannel(pkg, channel) {
    const { stdout, stderr } = await shell(`yarn global add ${pkg}@${channel}`);

    if (stderr) {
        console.error(stderr);
    }

    console.log(stdout);
}

export function getRegistryChannel(config: IConfig): string {
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

export async function checkForUpdates({ config, error, warn }): Promise<any> {
    const initialState = {
        ready: false,
        name: config.name,
        currentVersion: config.version,
    };

    if (existsSync(join(__dirname, "../../../..", ".git"))) {
        if (!process.env.CORE_DEVELOPER_MODE) {
            warn(`You are using a git clone for developers. Please install core via yarn for auto-updates.`);
        }

        return initialState;
    }

    try {
        const channel = configManager.get("channel");
        const cacheFile = ensureCacheFile(config);

        cli.action.start(`Checking for updates`);
        const latestVersion = await getLatestVersion(config.name, channel);
        cli.action.stop();

        if (latestVersion === undefined) {
            error(`We were unable to find any releases for the "${channel}" channel.`);

            return initialState;
        }

        if (semver.gt(latestVersion, config.version)) {
            return {
                ...initialState,
                ...{
                    ready: true,
                    updateVersion: latestVersion,
                    cache: cacheFile,
                },
            };
        }
    } catch (err) {
        error(err.message);
    }

    return initialState;
}
