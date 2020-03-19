export const defaults = {
    enabled: !process.env.CORE_API_DISABLED,
    host: process.env.CORE_API_HOST || "0.0.0.0",
    port: process.env.CORE_API_PORT || 4003,
    cache: {
        enabled: true,
        /**
         * How many seconds the server will try to complete the request and cache the result.
         *
         * Defaults to 8 seconds, set it to false if you do not care about the timeout.
         *
         * Setting it to false can result in requests never being completed, which is usually
         * caused by low-spec servers that are unable to handle the heavy load that results
         * out of SQL queries on the blocks and transactions tables.
         *
         * If you experience issues with the cache timeout, which is indicated by a 503 status codes,
         * you should consider upgrading your hardware or tweak your PostgreSQL settings.
         */
        generateTimeout: process.env.CORE_API_CACHE_TIMEOUT || 8000,
    },
    // @see https://hapijs.com/api#-serveroptionstls
    ssl: {
        enabled: process.env.CORE_API_SSL,
        host: process.env.CORE_API_SSL_HOST || "0.0.0.0",
        port: process.env.CORE_API_SSL_PORT || 8443,
        key: process.env.CORE_API_SSL_KEY,
        cert: process.env.CORE_API_SSL_CERT,
    },
    // @see https://github.com/wraithgar/hapi-rate-limit
    rateLimit: {
        enabled: !process.env.CORE_API_RATE_LIMIT,
        pathLimit: false,
        userLimit: process.env.CORE_API_RATE_LIMIT_USER_LIMIT || 100,
        userCache: {
            expiresIn: process.env.CORE_API_RATE_LIMIT_USER_EXPIRES || 60000,
        },
    },
    pagination: {
        limit: 100,
    },
    whitelist: ["*"],
    plugins: [],
};
