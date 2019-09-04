export const defaults = {
    flags: {},
    services: {
        log: {
            levels: {
                console: process.env.CORE_LOG_LEVEL || "emergency",
                file: process.env.CORE_LOG_LEVEL_FILE || "emergency",
            },
            fileRotator: {
                interval: "1d",
            },
        },
    },
    plugins: [],
};
