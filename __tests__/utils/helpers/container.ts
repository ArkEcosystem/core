import { app } from "@arkecosystem/core-container";
import { Container } from "@arkecosystem/core-interfaces";
import "@arkecosystem/core-jest-matchers";
import isString from "lodash.isstring";
import * as path from "path";

// copied from core-container registrars/plugin
const castOptions = options => {
    const blacklist: any = [];
    const regex = new RegExp(/^\d+$/);

    for (const key of Object.keys(options)) {
        const value = options[key];
        if (isString(value) && !blacklist.includes(key) && regex.test(value)) {
            options[key] = +value;
        }
    }

    return options;
};

// copied from core-container registrars/plugin and slightly modified
const applyToDefaults = (defaults, options) => {
    if (defaults) {
        options = Object.assign(defaults, options);
    }

    return castOptions(options);
};

export const setUpContainer = async (options: any): Promise<Container.IContainer> => {
    options.network = options.network || "testnet";

    process.env.CORE_PATH_DATA = options.data || `${process.env.HOME}/.core`;
    process.env.CORE_PATH_CONFIG = options.config
        ? options.config
        : path.resolve(__dirname, `../config/${options.network}`);

    await app.setUp(
        "2.1.1",
        {
            token: options.token || "ark",
            network: options.network,
        },
        options,
    );
    return app;
};

// copied from core-container registrars/plugin and slightly modified
export const registerWithContainer = async (plugin, options = {}) => {
    if (!plugin.register) {
        return undefined;
    }

    const name = plugin.name || plugin.pkg.name;
    const version = plugin.version || plugin.pkg.version;
    const defaults = plugin.defaults || plugin.pkg.defaults;
    const alias = plugin.alias || plugin.pkg.alias;

    options = applyToDefaults(defaults, options);

    const pluginRegistered = await plugin.register(app, options || {});
    app.register(
        alias || name,
        asValue({
            name,
            version,
            plugin: pluginRegistered,
            options,
        }),
    );

    return pluginRegistered;
};
