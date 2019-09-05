import { IConfig } from "@oclif/config";
import cli from "cli-ux";
import execa from "execa";
import { ensureDirSync, ensureFileSync, statSync } from "fs-extra";
import latestVersion from "latest-version";
import { join } from "path";
import semver from "semver";

import { abort } from "./cli";

// import { configManager } from "./config";

export const getLatestVersion = async (name: string, channel: string): Promise<string> => {
    try {
        const version = await latestVersion(name, { version: channel });

        return version;
    } catch {
        return undefined;
    }
};

export const ensureCacheFile = (config: IConfig): string => {
    ensureDirSync(config.cacheDir);

    const fileName = join(config.cacheDir, "update");

    ensureFileSync(fileName);

    return fileName;
};

export const installFromChannel = (pkg: string, channel: string): void => {
    const { stdout, stderr } = execa.sync(`yarn global add ${pkg}@${channel}`);

    if (stderr) {
        abort(stderr);
    }

    console.log(stdout);
};

export const getRegistryChannel = (version: string): string => {
    const channels: string[] = ["next"];

    let channel = "latest";
    for (const item of channels) {
        if (version.includes(`-${item}`)) {
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

        return Date.now() > staleAt.getTime();
    } catch {
        return true;
    }
};

export const checkForUpdates = async ({ config, warn }): Promise<any> => {
    const state = {
        ready: false,
        name: config.name,
        currentVersion: config.version,
        channel: getRegistryChannel(config.version), // @todo: use config or derive from version?
        // channel: configManager.get("channel"),
    };

    // if (existsSync(join(__dirname, "../../../..", ".git"))) {
    //     if (!process.env.CORE_DEVELOPER_MODE) {
    //         warn(`You are using a git clone for developers. Please install core via yarn for auto-updates.`);
    //     }

    //     return state;
    // }

    const cacheFile = ensureCacheFile(config);

    cli.action.start(`Checking for updates`);

    const latestVersion = await getLatestVersion(state.name, state.channel);

    cli.action.stop();

    if (latestVersion === undefined) {
        warn(`We were unable to find any releases for the "${state.channel}" channel.`);

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

    cli.action.stop();

    return state;
};
