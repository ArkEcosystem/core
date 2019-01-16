export const defaults = {
    dsn: process.env.CORE_ERROR_TRACKER_SENTRY_DSN,
    debug: true,
    attachStacktrace: true,
    environment: process.env.CORE_NETWORK_NAME,
};
