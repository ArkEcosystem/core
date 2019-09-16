module.exports = {
    flags: {},
    services: {},
    plugins: [{
            package: "@arkecosystem/core-transactions",
        },
        {
            package: "@arkecosystem/core-state",
        },
        {
            package: "@arkecosystem/core-database",
        },
        {
            package: "@arkecosystem/core-database-postgres",
            options: {
                connection: {
                    host: process.env.CORE_DB_HOST || "localhost",
                    port: process.env.CORE_DB_PORT || 5432,
                    database: process.env.CORE_DB_DATABASE || `${process.env.CORE_TOKEN}_${process.env.CORE_NETWORK_NAME}`,
                    user: process.env.CORE_DB_USERNAME || process.env.CORE_TOKEN,
                    password: process.env.CORE_DB_PASSWORD || "password",
                },
            },
        },
        {
            package: "@arkecosystem/core-transaction-pool",
            options: {
                enabled: true,
                maxTransactionsPerSender: process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER || 300,
                allowedSenders: [],
                dynamicFees: {
                    enabled: true,
                    minFeePool: 1000,
                    minFeeBroadcast: 1000,
                    addonBytes: {
                        transfer: 100,
                        secondSignature: 250,
                        delegateRegistration: 400000,
                        vote: 100,
                        multiSignature: 500,
                        ipfs: 250,
                        multiPayment: 500,
                        delegateResignation: 100,
                        htlcLock: 100,
                        htlcClaim: 0,
                        htlcRefund: 0,
                    },
                },
            },
        },
        {
            package: "@arkecosystem/core-p2p",
            options: {
                server: {
                    port: process.env.CORE_P2P_PORT || 4000,
                },
                minimumNetworkReach: 5,
            },
        },
        {
            package: "@arkecosystem/core-blockchain",
        },
        {
            package: "@arkecosystem/core-api",
            options: {
                enabled: !process.env.CORE_API_DISABLED,
                host: process.env.CORE_API_HOST || "0.0.0.0",
                port: process.env.CORE_API_PORT || 4003,
            },
        },
        {
            package: "@arkecosystem/core-webhooks",
            options: {
                enabled: process.env.CORE_WEBHOOKS_ENABLED,
                server: {
                    host: process.env.CORE_WEBHOOKS_HOST || "0.0.0.0",
                    port: process.env.CORE_WEBHOOKS_PORT || 4004,
                    whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
                },
            },
        },
        {
            package: "@arkecosystem/core-forger",
        },
        {
            package: "@arkecosystem/core-snapshots",
        },
    ],
};
