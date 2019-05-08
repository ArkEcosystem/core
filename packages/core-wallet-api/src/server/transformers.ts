export const transformPlugins = config => {
    const allowed = ["@arkecosystem/core-api", "@arkecosystem/core-json-rpc", "@arkecosystem/core-webhooks"];

    const result: { [key: string]: { enabled: boolean; port: number } } = {};

    for (const [name, options] of Object.entries(config.plugins) as any) {
        if (allowed.includes(name)) {
            if (options.server) {
                result[name] = {
                    enabled: !!options.server.enabled,
                    port: +options.server.port,
                };

                continue;
            }

            result[name] = {
                enabled: !!options.enabled,
                port: +options.port,
            };
        }
    }

    return result;
};
