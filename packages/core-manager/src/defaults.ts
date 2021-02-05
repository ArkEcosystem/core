export const defaults = {
    watcher: {
        enabled: !!process.env.CORE_WATCHER_ENABLED,
        resetDatabase: !!process.env.CORE_RESET_DATABASE,
        storage: `${process.env.CORE_PATH_DATA}/events.sqlite`,
        watch: {
            blocks: !process.env.CORE_WATCH_BLOCKS_DISABLED,
            errors: !process.env.CORE_WATCH_ERRORS_DISABLED,
            queries: !process.env.CORE_WATCH_QUERIES_DISABLED,
            queues: !process.env.CORE_WATCH_QUEUES_DISABLED,
            rounds: !process.env.CORE_WATCH_ROUNDS_DISABLED,
            schedules: !process.env.CORE_WATCH_SCHEDULES_DISABLED,
            transactions: !process.env.CORE_WATCH_TRANSACTIONS_DISABLED,
            wallets: !process.env.CORE_WATCH_WALLETS_DISABLED,
            webhooks: !process.env.CORE_WATCH_WEBHOOKS_DISABLED,
        },
    },
    logs: {
        enabled: !process.env.CORE_WATCH_LOGS_DISABLED,
        resetDatabase: !!process.env.CORE_RESET_DATABASE,
        storage: `${process.env.CORE_PATH_DATA}/logs.sqlite`,
        history: 30, // Days
    },
    server: {
        ip: process.env.CORE_MANAGER_PUBLIC_IP,
        http: {
            enabled: !process.env.CORE_MANAGER_DISABLED,
            host: process.env.CORE_MANAGER_HOST || "0.0.0.0",
            port: process.env.CORE_MANAGER_PORT || 4005,
        },
        // @see https://hapijs.com/api#-serveroptionstls
        https: {
            enabled: !!process.env.CORE_MANAGER_SSL,
            host: process.env.CORE_MANAGER_SSL_HOST || "0.0.0.0",
            port: process.env.CORE_MANAGER_SSL_PORT || 8445,
            tls: {
                key: process.env.CORE_MANAGER_SSL_KEY,
                cert: process.env.CORE_MANAGER_SSL_CERT,
            },
        },
    },
    plugins: {
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
        tokenAuthentication: {
            enabled: false,
            // Secret access token
            // token: "secret_token",
        },
        basicAuthentication: {
            enabled: false,
            // Aragon2Id secret key
            secret: "secret",
            users: [
                // Basic Auth User definition with Aragon2Id
                // {
                //     username: "username",
                //     password:
                //         "$argon2id$v=19$m=4096,t=3,p=1$NiGA5Cy5vFWTxhBaZMG/3Q$TwEFlzTuIB0fDy+qozEas+GzEiBcLRkm5F+/ClVRCDY",
                // },
            ],
        },
    },
    archiveFormat: process.env.CORE_MANAGER_ARCHIVE_FORMAT || "zip",
};
