import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

import { AnyObject } from "../contracts";

export const buildApplication = async (context?: AnyObject): Promise<Contracts.Kernel.Application> => {
    const app: Contracts.Kernel.Application = new Application(new Container.Container());

    if (context) {
        await app.bootstrap({
            flags: context.flags,
            plugins: context.plugins,
        });

        await app.boot();
    }

    return app;
};

export const buildPeerFlags = (flags: AnyObject) => {
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
