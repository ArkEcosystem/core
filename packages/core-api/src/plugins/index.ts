import { hapiAjv } from "./hapi-ajv";
import { whitelist } from "./whitelist";

export const preparePlugins = config => [
    {
        plugin: whitelist,
        options: {
            whitelist: config.whitelist,
        },
    },
    {
        plugin: require("./set-headers"),
    },
    { plugin: hapiAjv },
    {
        plugin: require("./cache"),
        options: config.cache,
    },
    {
        plugin: require("./rate-limit"),
        options: config.rateLimit,
    },
    {
        plugin: require("./pagination"),
        options: {
            query: {
                limit: {
                    default: config.pagination.limit,
                },
            },
        },
    },
];
