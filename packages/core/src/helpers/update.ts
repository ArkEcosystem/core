import { IConfig } from "@oclif/config";
import cli from "cli-ux";
import { sync } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { ensureDirSync, existsSync } from "fs-extra";
import latestVersion from "latest-version";
import { join } from "path";
import semver from "semver";

import { configManager } from "./config";

const getLatestVersion = async (name: string, channel: string): Promise<string> => {
    try {
        const version = await latestVersion(name, { version: channel });

        return version;
    } catch (error) {
        return undefined;
    }
};

const ensureCacheFile = (config: IConfig): string => {
    ensureDirSync(config.cacheDir);

    const fileName = join(config.cacheDir, "update");

    closeSync(openSync(fileName, "w"));

    return fileName;
};

export const installFromChannel = async (pkg, channel) => {
    const { stdout, stderr } = await sync(`yarn global add ${pkg}@${channel}`, { shell: true });

    if (stderr) {
        console.error(stderr);
    }

    console.log(stdout);
};

export const getRegistryChannel = (config: IConfig): string => {
    const channels: string[] = ["next"];

    let channel: string = "latest";
    for (const item of channels) {
        if (config.version.includes(`-${item}`)) {
            channel = item;
        }
    }

    return channel;
};

export const needsRefresh = (config: IConfig): boolean => {
    const cacheFile = ensureCacheFile(config);

    try {
        const { mtime } = statSync(cacheFile);
        const staleAt = new Date(mtime.valueOf() + 1000 * 60 * 60 * 24 * 1);

        return staleAt < new Date();
    } catch (err) {
        return true;
    }
};

export const checkForUpdates = async ({ config, error, warn }): Promise<any> => {
    const state = {
        ready: false,
        name: config.name,
        currentVersion: config.version,
        channel: configManager.get("channel"),
    };

    if (existsSync(join(__dirname, "../../../..", ".git"))) {
        if (!process.env.CORE_DEVELOPER_MODE) {
            warn(`You are using a git clone for developers. Please install core via yarn for auto-updates.`);
        }

        return state;
    }

    try {
        const cacheFile = ensureCacheFile(config);

        cli.action.start(`Checking for updates`);
        const latestVersion = await getLatestVersion(state.name, state.channel);
        cli.action.stop();

        if (latestVersion === undefined) {
            error(`We were unable to find any releases for the "${state.channel}" channel.`);

            return state;
        }

        if (semver.gt(latestVersion, config.version)) {
            return {
                ...state,
                ...{
                    ready: true,
                    updateVersion: latestVersion,
                    cache: cacheFile,
                },
            };
        }
    } catch (err) {
        error(err.message);
    } finally {
        cli.action.stop();
    }

    return state;
};
