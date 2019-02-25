export const defaults = {
    name: `${process.env.CORE_TOKEN}-core`,
    safe: true,
    level: process.env.CORE_LOG_LEVEL || "debug",
};
