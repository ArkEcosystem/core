import { P2P } from "@arkecosystem/core-interfaces";

export const transformPlugins = (plugins): P2P.IPeerPlugins => {
    const result: P2P.IPeerPlugins = {};

    for (let [name, options] of Object.entries(plugins) as Array<[string, any]>) {
        if (options.server) {
            options = options.server;
        }

        const port: number = Number(options.port);
        const enabled: boolean = !!options.enabled;

        if (isNaN(port) || name === "p2p") {
            continue;
        }

        result[name] = {
            enabled,
            port,
        };
    }

    return result;
};
