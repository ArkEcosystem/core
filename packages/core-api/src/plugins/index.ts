import { hapiAjv } from "./hapi-ajv";
import { whitelist } from "./whitelist";
import { wrapData } from "./wrap-data";

export const preparePlugins = (config) => [
    {
        plugin: whitelist,
        options: {
            whitelist: config.whitelist,
        },
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
        plugin: wrapData,
        options: {},
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
