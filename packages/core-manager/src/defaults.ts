export const defaults = {
    watcher: {
        enabled: process.env.CORE_WATCHER_ENABLED || false,
        resetDatabase: process.env.CORE_RESET_DATABASE,
        storage: `${process.env.CORE_PATH_DATA}/events.sqlite`,
        watch: {
            blocks: !process.env.CORE_WATCH_BLOCKS_DISABLED,
            transactions: !process.env.CORE_WATCH_TRANSACTIONS_DISABLED,
            wallets: !process.env.CORE_WATCH_WALLETS_DISABLED,
            rounds: !process.env.CORE_WATCH_ROUNDS_DISABLED,
            errors: !process.env.CORE_WATCH_ERRORS_DISABLED,
            logs: !process.env.CORE_WATCH_LOGS_DISABLED,
            queries: !process.env.CORE_WATCH_QUERIES_DISABLED,
            jobs: !process.env.CORE_WATCH_JOBS_DISABLED,
            queues: !process.env.CORE_WATCH_QUEUES_DISABLED,
            schedules: !process.env.CORE_WATCH_SCHEDULES_DISABLED,
            webhooks: !process.env.CORE_WATCH_WEBHOOKS_DISABLED,
        },
    },
    server: {
        http: {
            enabled: !process.env.CORE_MONITOR_DISABLED,
            host: process.env.CORE_MONITOR_HOST || "0.0.0.0",
            port: process.env.CORE_MONITOR_PORT || 4005,
        },
        // @see https://hapijs.com/api#-serveroptionstls
        https: {
            enabled: process.env.CORE_MONITOR_SSL,
            host: process.env.CORE_MONITOR_SSL_HOST || "0.0.0.0",
            port: process.env.CORE_MONITOR_SSL_PORT || 8445,
            tls: {
                key: process.env.CORE_MONITOR_SSL_KEY,
                cert: process.env.CORE_MONITOR_SSL_CERT,
            },
        },
    },
    plugins: {
        whitelist: ["*"],
        tokenAuthentication: {
            enabled: false,
            token: "secret_token",
        },
        basicAuthentication: {
            enabled: false,
            secret: "secret",
            users: [
                {
                    username: "username",
                    password:
                        "$argon2id$v=19$m=4096,t=3,p=1$NiGA5Cy5vFWTxhBaZMG/3Q$TwEFlzTuIB0fDy+qozEas+GzEiBcLRkm5F+/ClVRCDY",
                },
            ],
        },
    },
};
