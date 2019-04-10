export const defaults = {
    levels: {
        console: process.env.CORE_LOG_LEVEL || "debug",
        file: process.env.CORE_LOG_LEVEL_FILE || "trace",
    },
    fileRotator: {
        interval: "1d",
    },
};
