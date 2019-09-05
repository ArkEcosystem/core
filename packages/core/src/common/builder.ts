import { CommandFlags } from "../types";

export const buildPeerOptions = (flags: CommandFlags): CommandFlags => {
    const config = {
        networkStart: flags.networkStart,
        disableDiscovery: flags.disableDiscovery,
        skipDiscovery: flags.skipDiscovery,
        ignoreMinimumNetworkReach: flags.ignoreMinimumNetworkReach,
    };

    if (flags.launchMode === "seed") {
        config.skipDiscovery = true;
        config.ignoreMinimumNetworkReach = true;
    }

    return config;
};
