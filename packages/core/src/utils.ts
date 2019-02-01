export function buildPeerOptions(options) {
    const config = {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
        ignoreMinimumNetworkReach: options.ignoreMinimumNetworkReach,
    };

    if (options.launchMode === "seed") {
        config.skipDiscovery = true;
        config.ignoreMinimumNetworkReach = true;
    }

    return config;
}
