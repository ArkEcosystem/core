export const defaults = {
    enabled: process.env.CORE_WEBHOOKS_ENABLED,
    database: {
        dialect: "sqlite",
        storage: `${process.env.CORE_PATH_DATA}/webhooks.sqlite`,
        logging: process.env.CORE_DB_LOGGING,
    },
    server: {
        enabled: process.env.CORE_WEBHOOKS_API_ENABLED,
        host: process.env.CORE_WEBHOOKS_HOST || "0.0.0.0",
        port: process.env.CORE_WEBHOOKS_PORT || 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
        pagination: {
            limit: 100,
            include: ["/api/webhooks"],
        },
    },
};
