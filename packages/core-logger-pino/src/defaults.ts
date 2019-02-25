export const defaults = {
    name: `${process.env.CORE_TOKEN}-core`,
    safe: true,
    // @FIX: this causes the multistream to not log to the CLI
    // prettyPrint: { translateTime: true },
    level: process.env.CORE_LOG_LEVEL || "debug",
};
