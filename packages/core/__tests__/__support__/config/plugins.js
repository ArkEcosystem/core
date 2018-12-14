module.exports = {
    "@arkecosystem/core-event-emitter": {},
    "@arkecosystem/core-config": {},
    "@arkecosystem/core-logger-winston": {
        transports: {
            console: {
                options: {
                    level: process.env.ARK_LOG_LEVEL || "debug",
                },
            },
            dailyRotate: {
                options: {
                    level: process.env.ARK_LOG_LEVEL || "debug",
                },
            },
        },
    },
    "@arkecosystem/core-database-postgres": {
        connection: {
            host: process.env.ARK_DB_HOST || "localhost",
            port: process.env.ARK_DB_PORT || 5432,
            database: process.env.ARK_DB_DATABASE || "ark_development",
            user: process.env.ARK_DB_USERNAME || "ark",
            password: process.env.ARK_DB_PASSWORD || "password",
        },
    },
    "@arkecosystem/core-transaction-pool": {
        enabled: !process.env.ARK_TRANSACTION_POOL_DISABLED,
        maxTransactionsPerSender: process.env.ARK_TRANSACTION_POOL_MAX_PER_SENDER || 300,
        allowedSenders: [],
        // 100+ years in the future to avoid our hardcoded transactions used in the
        // tests to expire immediately
        maxTransactionAge: 4036608000,
    },
    "@arkecosystem/core-p2p": {
        host: process.env.ARK_P2P_HOST || "0.0.0.0",
        port: process.env.ARK_P2P_PORT || 4000,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    },
    "@arkecosystem/core-blockchain": {
        fastRebuild: false,
    },
    "@arkecosystem/core-forger": {
        hosts: [`http://127.0.0.1:${process.env.ARK_P2P_PORT || 4000}`],
    },
};
