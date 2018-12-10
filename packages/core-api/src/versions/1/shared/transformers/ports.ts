export function transformPortsLegacy(config: any) {
    const result = {};
    const keys = [
        "@arkecosystem/core-p2p",
        "@arkecosystem/core-api",
        "@arkecosystem/core-graphql",
        "@arkecosystem/core-json-rpc",
        "@arkecosystem/core-webhooks",
    ];

    result[keys[0]] = config.plugins[keys[0]].port;

    for (const [name, options] of Object.entries(config.plugins)) {
        // @ts-ignore
        if (keys.includes(name) && options.enabled) {
            // @ts-ignore
            if (options.server && options.server.enabled) {
                // @ts-ignore
                result[name] = +options.server.port;

                continue;
            }

            // @ts-ignore
            result[name] = +options.port;
        }
    }

    return result;
}
