import { commaArrayQuery } from "./comma-array-query";
import { dotSeparatedQuery } from "./dot-separated-query";
import { hapiAjv } from "./hapi-ajv";
import { log } from "./log";
import { responseHeaders } from "./response-headers";
import { whitelist } from "./whitelist";

export const preparePlugins = (config) => [
    {
        plugin: whitelist,
        options: {
            whitelist: config.whitelist,
            trustProxy: config.trustProxy,
        },
    },
    { plugin: hapiAjv },
    {
        plugin: log,
        options: {
            ...config.log,
            trustProxy: config.trustProxy,
        },
    },
    { plugin: commaArrayQuery },
    { plugin: dotSeparatedQuery },
    {
        plugin: require("./cache"),
        options: config.cache,
    },
    {
        plugin: require("./rate-limit"),
        options: {
            ...config.rateLimit,
            trustProxy: config.trustProxy,
        },
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
    { plugin: responseHeaders },
];
