import { cache } from "./cache";
import { commaArrayQuery } from "./comma-array-query";
import { dotSeparatedQuery } from "./dot-separated-query";
import { hapiAjv } from "./hapi-ajv";
import { pagination } from "./pagination";
import { rateLimit } from "./rate-limit";
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
        plugin: cache,
        options: config.cache,
    },
    {
        plugin: rateLimit,
        options: {
            ...config.rateLimit,
            trustProxy: config.trustProxy,
        },
    },
    {
        plugin: pagination,
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
