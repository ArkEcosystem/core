import { IConfig } from "@oclif/config";
import cli from "cli-ux";
import { sync } from "execa";
import { closeSync, openSync, statSync } from "fs";
import { ensureDirSync } from "fs-extra";
import latestVersion from "latest-version";
import { join } from "path";
import semver from "semver";
import { StatusSummary } from "simple-git";
import git from "simple-git/promise";
import { configManager } from "./config";

const ensureCacheFile = (config: IConfig): string => {
    ensureDirSync(config.cacheDir);

    const fileName = join(config.cacheDir, "update");

    closeSync(openSync(fileName, "w"));

    return fileName;
};

const checkForUpdatesFromNpm = async ({ state, config, warn }): Promise<string> => {
    state.currentVersion = config.version;
    state.channel = configManager.get("channel");

    const version = await latestVersion(state.name, { version: state.channel });

    if (version === undefined) {
        warn(`We were unable to find any releases for the "${state.channel}" channel.`);

        return state;
    }

    if (semver.gt(version, config.version)) {
        return {
            ...state,
            ...{
                ready: true,
                updateVersion: version,
                cache: ensureCacheFile(config),
            },
        };
    }

    return state;
};

const checkForUpdatesFromGit = async ({ state, config, warn }): Promise<any> => {
    const statusSummary: StatusSummary = await git().status();

    if (statusSummary.behind <= 0) {
        warn("We were unable to find any new commits.");

        return state;
    }

    state.channel = await git().revparse(["--abbrev-ref", "HEAD"]);
    state.currentVersion = await git().revparse(["HEAD"]);
    state.updateVersion = await git().revparse([state.channel]);

    return {
        ...state,
        ...{
            ready: true,
            cache: ensureCacheFile(config),
        },
    };
};

export const installFromChannel = async (pkg, channel) => {
    const { stdout, stderr } = sync(`yarn global add ${pkg}@${channel}`, { shell: true });

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
    };

    try {
        cli.action.start("Checking for updates");

        if (configManager.get("updateMethod") === "git") {
            return checkForUpdatesFromGit({ state, config, warn });
        } else if (configManager.get("updateMethod") === "npm") {
            return checkForUpdatesFromNpm({ state, config, warn });
        }

        error("We were unable to determine an update method.");
    } catch (err) {
        error(err.message);
    } finally {
        cli.action.stop();
    }

    return state;
};
