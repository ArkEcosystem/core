export declare const defaults: {
    enabled: boolean;
    host: string;
    port: string | number;
    cache: {
        enabled: boolean;
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
        generateTimeout: string | number;
    };
    ssl: {
        enabled: string;
        host: string;
        port: string | number;
        key: string;
        cert: string;
    };
    rateLimit: {
        enabled: boolean;
        pathLimit: boolean;
        userLimit: string | number;
        userCache: {
            expiresIn: string | number;
        };
    };
    pagination: {
        limit: number;
    };
    whitelist: string[];
    plugins: any[];
};
