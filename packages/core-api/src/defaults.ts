export const defaults = {
    server: {
        http: {
            enabled: !process.env.CORE_API_DISABLED,
            host: process.env.CORE_API_HOST || "0.0.0.0",
            port: process.env.CORE_API_PORT || 4003,
        },
        // @see https://hapijs.com/api#-serveroptionstls
        https: {
            enabled: process.env.CORE_API_SSL,
            host: process.env.CORE_API_SSL_HOST || "0.0.0.0",
            port: process.env.CORE_API_SSL_PORT || 8443,
            tls: {
                key: process.env.CORE_API_SSL_KEY,
                cert: process.env.CORE_API_SSL_CERT,
            },
        },
    },
    plugins: {
        cache: {
            enabled: !process.env.CORE_API_CACHE,
            stdTTL: 8,
            checkperiod: 120,
        },
        rateLimit: {
            enabled: !process.env.CORE_API_RATE_LIMIT,
            points: process.env.CORE_API_RATE_LIMIT_USER_LIMIT || 300,
            duration: process.env.CORE_API_RATE_LIMIT_USER_EXPIRES || 60000,
            whitelist: process.env.CORE_API_RATE_LIMIT_WHITELIST
                ? process.env.CORE_API_RATE_LIMIT_WHITELIST.split(",")
                : ["*"],
            blacklist: process.env.CORE_API_RATE_LIMIT_BLACKLIST
                ? process.env.CORE_API_RATE_LIMIT_BLACKLIST.split(",")
                : [],
        },
        pagination: {
            limit: 100,
        },
        whitelist: ["*"],
    },
};
