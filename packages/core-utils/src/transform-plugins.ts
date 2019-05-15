import { P2P } from "@arkecosystem/core-interfaces";

export const transformPlugins = (plugins): P2P.IPeerPlugins => {
    const result: P2P.IPeerPlugins = {};

    for (let [name, options] of Object.entries(plugins) as Array<[string, any]>) {
        if (options.server) {
            options = options.server;
        }

        if (name.includes("/")) {
            name = name.split("/").reverse()[0];
        }

        name = name.split("-").reverse()[0];

        const port = Number(options.port);
        const enabled = !!options.enabled;

        if (isNaN(port) || !enabled || name === "p2p") {
            continue;
        }

        result[name] = {
            port,
        };
    }

    return result;
};
