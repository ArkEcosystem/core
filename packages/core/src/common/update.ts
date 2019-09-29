import cli from "cli-ux";
import execa from "execa";
import latestVersion from "latest-version";
import semver from "semver";

import { abort } from "./cli";

// import { configManager } from "./config";

// todo: review the implementation of all methods

export const getLatestVersion = async (name: string, channel: string): Promise<string> => {
    try {
        const version = await latestVersion(name, { version: channel });

        return version;
    } catch {
        return undefined;
    }
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

export const checkForUpdates = async ({ config, warn }): Promise<any> => {
    const state = {
        ready: false,
        name: config.name,
        currentVersion: config.version,
        channel: getRegistryChannel(config.version),
    };

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
            },
        };
    }

    return state;
};
