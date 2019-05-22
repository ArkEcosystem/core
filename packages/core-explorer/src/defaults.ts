export const defaults = {
    server: {
        host: process.env.CORE_EXPLORER_HOST || "0.0.0.0",
        port: process.env.CORE_EXPLORER_PORT || 4200,
    },
    path: process.env.CORE_EXPLORER_PATH,
};
