import { dotSeparatedQuery } from "./dot-separated-query";
import { commaArrayQuery } from "./comma-array-query";
import { hapiAjv } from "./hapi-ajv";
import { whitelist } from "./whitelist";
import { responseHeaders } from "./response-headers";

export const preparePlugins = (config) => [
    {
        plugin: whitelist,
        options: {
            whitelist: config.whitelist,
        },
    },
    { plugin: hapiAjv },
    { plugin: commaArrayQuery },
    { plugin: dotSeparatedQuery },
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
    { plugin: responseHeaders },
];
