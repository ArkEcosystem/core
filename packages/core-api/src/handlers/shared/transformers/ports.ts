export const transformPorts = (config: any) => {
    const result = {};
    const keys = ["@arkecosystem/core-p2p", "@arkecosystem/core-api", "@arkecosystem/core-webhooks"];

    for (const plugin of Object.values(config.get("app.plugins"))) {
        const { package: name, options } = plugin as any;

        if (keys.includes(name) && options.enabled) {
            if (options.server && options.server.enabled) {
                result[name] = +options.server.port;

                continue;
            }

            result[name] = +options.port;
        }
    }

    return result;
};
