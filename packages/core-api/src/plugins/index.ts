import { plugins } from "@arkecosystem/core-http-utils";

export const preparePlugins = config => [
    {
        plugin: plugins.whitelist,
        options: {
            whitelist: config.whitelist,
        },
    },
    {
        plugin: require("./set-headers"),
    },
    { plugin: plugins.hapiAjv },
    {
        plugin: require("hapi-rate-limit"),
        options: config.rateLimit,
    },
    {
        plugin: require("hapi-pagination"),
        options: {
            meta: {
                baseUri: "",
            },
            query: {
                limit: {
                    default: config.pagination.limit,
                },
            },
            results: {
                name: "data",
            },
            routes: {
                include: config.pagination.include,
                exclude: ["*"],
            },
        },
    },
];
